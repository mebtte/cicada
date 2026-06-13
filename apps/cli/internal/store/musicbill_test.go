package store

import (
	"cicada/internal/config"
	"testing"
	"time"
)

func setupMusicbillTransferTest(t *testing.T) {
	t.Helper()
	if err := ResetForTests(); err != nil {
		t.Fatalf("reset store: %v", err)
	}
	t.Cleanup(func() {
		if err := ResetForTests(); err != nil {
			t.Fatalf("cleanup store: %v", err)
		}
	})
	config.Set(config.Config{
		Mode: config.ModeProduction,
		Data: t.TempDir(),
		Port: 8000,
	})
	if err := Initialize(); err != nil {
		t.Fatalf("initialize store: %v", err)
	}
	now := time.Now().UnixMilli()
	if _, err := DB().Exec(
		`INSERT INTO user (id,username,password,nickname,joinTimestamp) VALUES
			('OWNER1','owner',?, 'Owner', ?),
			('SHARE1','shared',?, 'Shared', ?),
			('PEND01','pending',?, 'Pending', ?)`,
		DoubleMD5("password"), now,
		DoubleMD5("password"), now,
		DoubleMD5("password"), now,
	); err != nil {
		t.Fatalf("insert users: %v", err)
	}
	if _, err := DB().Exec(
		`INSERT INTO musicbill (id,userId,name,createTimestamp) VALUES ('BILL01','OWNER1','Bill',?)`,
		now,
	); err != nil {
		t.Fatalf("insert musicbill: %v", err)
	}
	if _, err := DB().Exec(
		`INSERT INTO shared_musicbill (musicbillId,sharedUserId,inviteUserId,inviteTimestamp,accepted) VALUES
			('BILL01','SHARE1','OWNER1',?,1),
			('BILL01','PEND01','OWNER1',?,0)`,
		now, now,
	); err != nil {
		t.Fatalf("insert shared rows: %v", err)
	}
}

func TestTransferMusicbillOwnerSwapsRoles(t *testing.T) {
	setupMusicbillTransferTest(t)

	ok, err := TransferMusicbillOwner("BILL01", "OWNER1", "SHARE1")
	if err != nil {
		t.Fatalf("transfer: %v", err)
	}
	if !ok {
		t.Fatalf("expected transfer to succeed")
	}

	mb, err := GetMusicbillByID("BILL01")
	if err != nil {
		t.Fatalf("reload musicbill: %v", err)
	}
	if mb.UserID != "SHARE1" {
		t.Fatalf("expected owner=SHARE1, got %q", mb.UserID)
	}

	users, err := GetSharedUsersInMusicbill("BILL01")
	if err != nil {
		t.Fatalf("shared list: %v", err)
	}
	// new owner removed from shared list; old owner added as accepted; pending row untouched.
	var oldOwnerAccepted, newOwnerPresent, pendingPresent bool
	for _, su := range users {
		if su.SharedUserID == "OWNER1" && su.Accepted == 1 {
			oldOwnerAccepted = true
		}
		if su.SharedUserID == "SHARE1" {
			newOwnerPresent = true
		}
		if su.SharedUserID == "PEND01" {
			pendingPresent = true
		}
	}
	if !oldOwnerAccepted {
		t.Fatalf("expected previous owner kept as accepted shared user, rows=%+v", users)
	}
	if newOwnerPresent {
		t.Fatalf("expected new owner removed from shared list, rows=%+v", users)
	}
	if !pendingPresent {
		t.Fatalf("expected unrelated pending row preserved, rows=%+v", users)
	}
}

func TestTransferMusicbillOwnerRejectsWhenCallerNoLongerOwner(t *testing.T) {
	setupMusicbillTransferTest(t)

	ok, err := TransferMusicbillOwner("BILL01", "SHARE1" /* wrong from */, "SHARE1")
	if err != nil {
		t.Fatalf("transfer: %v", err)
	}
	if ok {
		t.Fatalf("expected transfer to fail when caller is not current owner")
	}

	mb, _ := GetMusicbillByID("BILL01")
	if mb.UserID != "OWNER1" {
		t.Fatalf("unexpected owner change: %q", mb.UserID)
	}
}

func TestTransferMusicbillOwnerRejectsPendingTarget(t *testing.T) {
	setupMusicbillTransferTest(t)

	ok, err := TransferMusicbillOwner("BILL01", "OWNER1", "PEND01")
	if err != nil {
		t.Fatalf("transfer: %v", err)
	}
	if ok {
		t.Fatalf("expected transfer to fail when target has not accepted")
	}

	mb, _ := GetMusicbillByID("BILL01")
	if mb.UserID != "OWNER1" {
		t.Fatalf("unexpected owner change: %q", mb.UserID)
	}
}

func TestSearchPublicMusicbillsRanksNameAndMatchesOwner(t *testing.T) {
	if err := ResetForTests(); err != nil {
		t.Fatalf("reset store: %v", err)
	}
	t.Cleanup(func() {
		if err := ResetForTests(); err != nil {
			t.Fatalf("cleanup store: %v", err)
		}
	})

	config.Set(config.Config{
		Mode: config.ModeProduction,
		Data: t.TempDir(),
		Port: 8000,
	})
	if err := Initialize(); err != nil {
		t.Fatalf("initialize store: %v", err)
	}

	now := time.Now().UnixMilli()
	if _, err := DB().Exec(
		`INSERT INTO user (id,username,password,nickname,joinTimestamp) VALUES
			('USER01','owner',?, 'Road Curator', ?),
			('USER02','listener',?, 'Listener', ?)`,
		DoubleMD5("password"), now,
		DoubleMD5("password"), now,
	); err != nil {
		t.Fatalf("insert users: %v", err)
	}
	if _, err := DB().Exec(
		`INSERT INTO musicbill (id,userId,name,public,createTimestamp) VALUES
			('BILL11','USER02','Road Trip',1,?),
			('BILL12','USER01','Chill Set',1,?),
			('BILL13','USER02','Road Private',0,?)`,
		now-100,
		now,
		now+100,
	); err != nil {
		t.Fatalf("insert musicbills: %v", err)
	}

	total, musicbills, err := SearchPublicMusicbills("Road", 1, 10)
	if err != nil {
		t.Fatalf("search public musicbills: %v", err)
	}
	if total != 2 || len(musicbills) != 2 {
		t.Fatalf("unexpected search result: total=%d musicbills=%+v", total, musicbills)
	}
	got := []string{musicbills[0].ID, musicbills[1].ID}
	want := []string{"BILL11", "BILL12"}
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("unexpected order: got %v want %v", got, want)
		}
	}
}
