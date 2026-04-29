// Package migration manages cicada data version upgrades.
//
// The data version is an integer stored in data/v that is independent of the
// CLI's git tag version. Each schema or on-disk-layout change ships as a
// Migration with a unique To version; on startup, registered migrations
// between the current data version and the latest are run in order, wrapped
// in a sqlite transaction plus a file-operation journal so a crash mid-way
// can be rolled back.
package migration

import (
	"context"
	"database/sql"
	"fmt"
	"sort"
	"sync"
)

const (
	// LegacyMaxVersion is the highest value written by pre-migration-system
	// binaries (cicada v2.x). Any v file value at or below this is bridged to
	// BaselineVersion on first startup with the new binary.
	LegacyMaxVersion = 2

	// BaselineVersion is the starting integer of the new data-version scheme.
	// The gap above LegacyMaxVersion makes scheme switches obvious in logs.
	BaselineVersion = 100
)

// Env carries everything a Migration's Up function may touch. Schema changes
// must go through Tx; file-system changes must go through Journal.
type Env struct {
	Tx      *sql.Tx
	DataDir string
	Journal *Journal
}

// Migration describes a single version step.
type Migration struct {
	From        int
	To          int
	Description string
	// Destructive marks migrations that drop columns, rewrite primary keys,
	// or relocate large amounts of asset data. They run automatically — the
	// safety net is the db.backup + journal mechanism — but the flag is
	// surfaced in logs so operators understand what just ran.
	Destructive bool
	Up          func(ctx context.Context, env *Env) error
}

var (
	mu         sync.Mutex
	registered []Migration
)

// Register adds a migration to the global registry. Call from init() in each
// migration file. Panics on duplicate To values or invalid From >= To.
func Register(m Migration) {
	mu.Lock()
	defer mu.Unlock()
	if m.From >= m.To {
		panic(fmt.Sprintf("migration: From (%d) must be less than To (%d)", m.From, m.To))
	}
	if m.Up == nil {
		panic(fmt.Sprintf("migration %d->%d: Up is nil", m.From, m.To))
	}
	for _, existing := range registered {
		if existing.To == m.To {
			panic(fmt.Sprintf("migration: duplicate To version %d", m.To))
		}
	}
	registered = append(registered, m)
}

// Migrations returns a copy of the registered migrations sorted by To.
func Migrations() []Migration {
	mu.Lock()
	defer mu.Unlock()
	out := make([]Migration, len(registered))
	copy(out, registered)
	sort.Slice(out, func(i, j int) bool { return out[i].To < out[j].To })
	return out
}

// CurrentVersion returns the highest To among registered migrations, or
// BaselineVersion when none are registered.
func CurrentVersion() int {
	v := BaselineVersion
	for _, m := range Migrations() {
		if m.To > v {
			v = m.To
		}
	}
	return v
}

// resetForTests clears the registry. Tests use it to install a fixture set of
// migrations without leaking across cases.
func resetForTests() {
	mu.Lock()
	defer mu.Unlock()
	registered = nil
}
