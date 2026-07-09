-- Schema do banco de dados — Sistema Laço Automação
-- SQLite

PRAGMA foreign_keys = ON;

-- =========================================================
-- provas
-- =========================================================
CREATE TABLE IF NOT EXISTS provas (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    nome        TEXT NOT NULL,
    data        TEXT NOT NULL,                 -- ISO 8601 (YYYY-MM-DD)
    bateria     INTEGER NOT NULL DEFAULT 0      -- boolean: 0 = sem baterias, 1 = com baterias
                    CHECK (bateria IN (0, 1)),
    bateria_nu  INTEGER,                        -- quantidade total de baterias (só relevante quando bateria = 1)
    categoria   TEXT NOT NULL DEFAULT 'Aberta'
                    CHECK (categoria IN ('Aberta', 'Soma')),
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now')),

    CHECK (bateria = 0 OR bateria_nu IS NOT NULL) -- se tem bateria, precisa informar quantas
);

-- =========================================================
-- cabeceiros
-- =========================================================
CREATE TABLE IF NOT EXISTS cabeceiros (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    nome        TEXT NOT NULL,
    hc          REAL NOT NULL,
    id_prova    INTEGER NOT NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now')),

    FOREIGN KEY (id_prova) REFERENCES provas(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_cabeceiros_id_prova ON cabeceiros(id_prova);

-- =========================================================
-- pezeiros
-- =========================================================
CREATE TABLE IF NOT EXISTS pezeiros (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    nome        TEXT NOT NULL,
    hc          REAL NOT NULL,
    id_prova    INTEGER NOT NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now')),

    FOREIGN KEY (id_prova) REFERENCES provas(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_pezeiros_id_prova ON pezeiros(id_prova);

-- =========================================================
-- duplas
-- =========================================================
CREATE TABLE IF NOT EXISTS duplas (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    id_cabeceiro    INTEGER NOT NULL,
    id_pezeiro      INTEGER NOT NULL,

    -- Qual bateria essa dupla pertence (relevante quando a prova tem provas.bateria = 1).
    -- Validado na aplicação: deve estar entre 1 e provas.bateria_nu.
    numero_bateria  INTEGER,

    -- Número/código de inscrição da dupla na prova.
    inscricao       INTEGER,

    hc_soma         REAL,                       -- calculado no front-end (hc do cabeceiro + hc do pezeiro)
    bois_nu         INTEGER NOT NULL DEFAULT 0,  -- quantidade de bois que essa dupla deve rodar

    boi_1           REAL,
    boi_2           REAL,
    boi_3           REAL,
    boi_4           REAL,
    boi_5           REAL,
    boi_6           REAL,

    parcial         REAL,                       -- calculado no front-end (soma de boi_1..boi_5)
    boi_final       REAL,                       -- campo independente, editável manualmente
    media           REAL,                       -- calculado no front-end (boi_1..boi_5 + boi_final)
    para_ganhar     REAL,                       -- calculado no front-end (comparação com o líder)

    ganhador        INTEGER NOT NULL DEFAULT 0   -- boolean, sem regra de unicidade por enquanto
                        CHECK (ganhador IN (0, 1)),

    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now')),

    FOREIGN KEY (id_cabeceiro) REFERENCES cabeceiros(id) ON DELETE CASCADE,
    FOREIGN KEY (id_pezeiro)   REFERENCES pezeiros(id)   ON DELETE CASCADE,

    -- Mesma dupla (cabeceiro + pezeiro) não pode se repetir dentro da mesma bateria
    UNIQUE (id_cabeceiro, id_pezeiro, numero_bateria)
);

CREATE INDEX IF NOT EXISTS idx_duplas_id_cabeceiro   ON duplas(id_cabeceiro);
CREATE INDEX IF NOT EXISTS idx_duplas_id_pezeiro     ON duplas(id_pezeiro);
CREATE INDEX IF NOT EXISTS idx_duplas_numero_bateria ON duplas(numero_bateria);