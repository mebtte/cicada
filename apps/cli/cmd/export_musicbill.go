package cmd

import (
	"bufio"
	"context"
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"unicode/utf8"

	"cicada/internal/config"
	"cicada/internal/ffmpeg"
	"cicada/internal/store"

	"github.com/spf13/cobra"
)

var exportMusicbillCmd = &cobra.Command{
	Use:   "export-musicbill [destination]",
	Short: "Export a musicbill's music to a directory (interactive)",
	Args:  cobra.MaximumNArgs(1),
	RunE:  runExportMusicbill,
}

var exportMusicbillData string

func init() {
	exportMusicbillCmd.Flags().StringVar(&exportMusicbillData, "data", "", "Data directory, defaults to <exe_dir>/cicada_data (env: CICADA_DATA)")
	rootCmd.AddCommand(exportMusicbillCmd)
}

func runExportMusicbill(cmd *cobra.Command, args []string) error {
	dest := "."
	if len(args) > 0 {
		dest = args[0]
	}

	data := exportMusicbillData
	if data == "" {
		data = config.DefaultDataPath()
	}

	config.Set(config.Config{
		Mode: config.ModeProduction,
		Data: data,
	})

	if err := store.Initialize(); err != nil {
		return fmt.Errorf("initialize: %w", err)
	}

	reader := bufio.NewReader(os.Stdin)

	// 交互问题①: 输入 musicbill id, 循环直到查到存在的乐单.
	var mb *store.MusicbillWithOwner
	for {
		fmt.Print("musicbill id: ")
		line, err := reader.ReadString('\n')
		if err != nil {
			return fmt.Errorf("read input: %w", err)
		}
		id := strings.TrimSpace(line)
		if id == "" {
			continue
		}
		mb, err = store.GetMusicbillByID(id)
		if err != nil {
			if err == sql.ErrNoRows {
				fmt.Printf("musicbill %q not found, try again\n", id)
				continue
			}
			return fmt.Errorf("get musicbill: %w", err)
		}
		break
	}
	fmt.Printf("musicbill: %s (owner: %s)\n", mb.Name, mb.OwnerNickname)

	// 交互问题②: 原文件 / 转码文件, 默认原文件.
	exportMode := promptChoice(reader, "export type", []string{"original file", "transcode to mp3"}, 1)
	transcode := exportMode == 2

	// 交互问题③: 仅转码时询问码率, 格式固定 mp3, 默认流畅.
	quality := ""
	if transcode {
		q := promptChoice(reader, "mp3 bitrate", []string{"smooth (192k)", "source bitrate"}, 1)
		if q == 1 {
			quality = "smooth"
		} else {
			quality = "source"
		}
	}

	if _, _, err := exportMusicbillTo(mb, dest, transcode, quality); err != nil {
		return err
	}
	return nil
}

// promptChoice 循环读取用户输入, 直到得到 1..len(options) 之间的合法序号.
// def 为默认序号(1-based), 用户直接回车时返回该默认值.
func promptChoice(reader *bufio.Reader, question string, options []string, def int) int {
	for {
		fmt.Println(question + ":")
		for i, opt := range options {
			marker := ""
			if i+1 == def {
				marker = " (default)"
			}
			fmt.Printf("  %d) %s%s\n", i+1, opt, marker)
		}
		fmt.Print("> ")
		line, err := reader.ReadString('\n')
		if err != nil {
			// 读取失败(如 EOF)时回退到默认选项, 避免死循环.
			return def
		}
		choice := strings.TrimSpace(line)
		if choice == "" {
			// 直接回车使用默认值.
			return def
		}
		for i := range options {
			if choice == fmt.Sprintf("%d", i+1) {
				return i + 1
			}
		}
		fmt.Println("invalid choice, try again")
	}
}

// exportMusicbillTo 把乐单内的音乐导出到 dest 下以乐单名命名的子目录. 与交互逻辑解耦, 便于测试.
func exportMusicbillTo(mb *store.MusicbillWithOwner, dest string, transcode bool, quality string) (exported, skipped int, err error) {
	musics, err := store.GetMusicsInMusicbill(mb.ID)
	if err != nil {
		return 0, 0, fmt.Errorf("get musics: %w", err)
	}
	if len(musics) == 0 {
		fmt.Println("musicbill is empty")
		return 0, 0, nil
	}

	musicIDs := make([]string, len(musics))
	for i, m := range musics {
		musicIDs[i] = m.ID
	}
	performerRelations, err := store.GetArtistsInMusicIDsByRole(musicIDs, store.MusicArtistRolePerformer)
	if err != nil {
		return 0, 0, fmt.Errorf("get performers: %w", err)
	}
	performerMap := make(map[string][]string)
	for _, pr := range performerRelations {
		performerMap[pr.MusicID] = append(performerMap[pr.MusicID], pr.Name)
	}

	// 在 dest 下新建以乐单名命名的子目录; 名称过滤非法字符, 为空则回退用 id.
	dirName := strings.TrimSpace(sanitizeFilename(mb.Name))
	if dirName == "" {
		dirName = mb.ID
	}
	outDir := filepath.Join(dest, dirName)
	if err := os.MkdirAll(outDir, 0755); err != nil {
		return 0, 0, fmt.Errorf("create destination: %w", err)
	}

	ctx := context.Background()
	used := make(map[string]bool) // 记录已用文件名, 处理重名.

	type exportFailure struct {
		filename string
		reason   error
	}
	var failures []exportFailure

	total := len(musics)
	for i, m := range musics {
		performers := performerMap[m.ID]

		base := exportMusicBaseName(performers, m.Name)

		ext := ".mp3"
		if !transcode {
			ext = filepath.Ext(m.Asset)
		}

		reservedSuffix := ""
		if transcode {
			reservedSuffix = transcodeTempSuffix
		}
		filename := exportMusicFilename(used, base, ext, reservedSuffix)
		dst := filepath.Join(outDir, filename)

		_, src := config.AssetPath(config.AssetTypeMusic, m.Asset)

		// 进度展示: (第几个/总数).
		progress := fmt.Sprintf("(%d/%d)", i+1, total)

		var e error
		if transcode {
			e = transcodeMusicToMP3(ctx, src, dst, m, performers, quality)
		} else {
			e = exportCopyFile(src, dst)
		}
		if e != nil {
			// 清理可能产生的半成品文件, 避免残留不完整的导出结果.
			os.Remove(dst)
			fmt.Fprintf(os.Stderr, "%s skip %s\n", progress, filename)
			failures = append(failures, exportFailure{filename: filename, reason: e})
			continue
		}

		fmt.Printf("%s %s\n", progress, filename)
		exported++
	}

	// 全部完成后汇总失败条目及原因.
	if len(failures) > 0 {
		fmt.Fprintf(os.Stderr, "\n%d failed:\n", len(failures))
		for _, f := range failures {
			fmt.Fprintf(os.Stderr, "  %s: %v\n", f.filename, f.reason)
		}
	}

	return exported, len(failures), nil
}

// transcodeMusicToMP3 把源文件转码为 mp3 并写入标题/歌手/封面元数据.
func transcodeMusicToMP3(ctx context.Context, src, dst string, m store.MusicInMusicbill, performers []string, quality string) error {
	info, err := ffmpeg.ProbeAudioStream(ctx, src)
	if err != nil {
		return fmt.Errorf("probe: %w", err)
	}

	bitrate := mp3Bitrate(info, quality)

	// 先转码到临时文件, 再写入元数据/封面, 最后落到目标路径.
	tmp := dst + transcodeTempSuffix
	defer os.Remove(tmp)
	if err := ffmpeg.TranscodeAudio(ctx, src, tmp, ffmpeg.AudioTranscodeProfile{Codec: "mp3", Bitrate: bitrate}); err != nil {
		return fmt.Errorf("transcode: %w", err)
	}

	coverPath := ""
	if m.Cover != "" {
		_, coverPath = config.AssetPath(config.AssetTypeMusicCover, m.Cover)
	}
	meta := ffmpeg.AudioMetadata{
		Title:  m.Name,
		Artist: strings.Join(performers, ","),
	}
	if err := ffmpeg.RewriteAudioMetadata(ctx, tmp, dst, meta, coverPath); err != nil {
		return fmt.Errorf("write metadata: %w", err)
	}
	return nil
}

// mp3Bitrate 根据流畅/源码率两种模式计算目标码率字符串(如 "192k").
func mp3Bitrate(info ffmpeg.AudioStreamInfo, quality string) string {
	const smoothKbps = 192
	if quality == "source" {
		// 源码率: 直接取源文件码率, 不封顶(交给 libmp3lame 自行限制); 未知时回退 320k.
		if info.BitRate <= 0 {
			return "320k"
		}
		return fmt.Sprintf("%dk", info.BitRate/1000)
	}
	// 流畅: 无损或未知码率取 192k, 否则取 min(源码率, 192k).
	if info.Lossless() || info.BitRate <= 0 {
		return fmt.Sprintf("%dk", smoothKbps)
	}
	kbps := min(int(info.BitRate/1000), smoothKbps)
	return fmt.Sprintf("%dk", kbps)
}

const (
	// maxFilenameBytes 是多数文件系统(ext4/APFS/NTFS)单个文件名的字节上限.
	maxFilenameBytes                     = 255
	maxExportMusicbillFilenamePerformers = 3
	transcodeTempSuffix                  = ".transcoding.mp3"
)

// exportMusicBaseName 生成导出文件的主文件名: singer1,singer2 - music name.
// 歌手过多时只保留前三位, 再追加 "...", 避免文件名过长且保留主要识别信息.
func exportMusicBaseName(performers []string, musicName string) string {
	if len(performers) == 0 {
		return musicName
	}

	visiblePerformers := performers
	if len(visiblePerformers) > maxExportMusicbillFilenamePerformers {
		visiblePerformers = append(
			append([]string{}, visiblePerformers[:maxExportMusicbillFilenamePerformers]...),
			"...",
		)
	}
	return strings.Join(visiblePerformers, ",") + " - " + musicName
}

// exportMusicFilename 在已用名集合中生成不冲突的文件名.
// reservedSuffix 用于预留转码临时文件后缀, 避免临时路径先触发 "file name too long".
func exportMusicFilename(used map[string]bool, base, ext, reservedSuffix string) string {
	safeBase := sanitizeFilename(base)
	for i := 1; ; i++ {
		dedupSuffix := ""
		if i > 1 {
			dedupSuffix = fmt.Sprintf(" (%d)", i)
		}

		// 每次重名重试都重新计算预算, 保证 "文件名 + 临时后缀" 不超过单文件名上限.
		maxBaseBytes := maxFilenameBytes - len(ext) - len(reservedSuffix) - len(dedupSuffix)
		name := truncateUTF8(safeBase, maxBaseBytes) + dedupSuffix + ext
		if !used[name] {
			used[name] = true
			return name
		}
	}
}

// truncateUTF8 把字符串按字节上限截断, 且不切断多字节 UTF-8 字符(中文歌手名每字 3 字节).
func truncateUTF8(s string, maxBytes int) string {
	if maxBytes < 0 {
		maxBytes = 0
	}
	if len(s) <= maxBytes {
		return s
	}
	b := 0
	out := make([]rune, 0, len(s))
	for _, r := range s {
		size := utf8.RuneLen(r)
		if b+size > maxBytes {
			break
		}
		out = append(out, r)
		b += size
	}
	return string(out)
}
