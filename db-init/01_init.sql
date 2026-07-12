CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Amministratori
CREATE TABLE administrators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Elezioni
CREATE TABLE elections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(100) NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) CHECK (status IN ('ACTIVE', 'BLOCKED')) DEFAULT 'ACTIVE',
    auth_contract_address VARCHAR(42), 
    vote_contract_address VARCHAR(42),
    merkle_root VARCHAR(66),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata_hash VARCHAR(66), -- Hash salvato nello Smart Contract
    clear_metadata JSONB -- Metadati elezione in chiaro per l'interfaccia utente
);

-- Candidati
CREATE TABLE candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    election_id UUID REFERENCES elections(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    party_name VARCHAR(100), 
    UNIQUE(election_id, name)
);

-- Whitelist
CREATE TABLE whitelist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    election_id UUID REFERENCES elections(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL, 
    
    -- Stato registrazione
    has_registered BOOLEAN DEFAULT FALSE,
    registered_at TIMESTAMP WITH TIME ZONE,
    registration_tx_id VARCHAR(80), -- ID transazione blockchain della registrazione
    
    -- Recupero sessione in caso di crash
    blinded_token_hash VARCHAR(255), 
    signed_voucher TEXT,
    merkle_proof JSONB,             
    
    UNIQUE(election_id, email)
);

-- OTP Codes
CREATE TABLE otp_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- Tabella per tracciare i voucher spesi
CREATE TABLE spent_vouchers (
    signature_hash VARCHAR(255) PRIMARY KEY,
    election_id UUID NOT NULL,
    wallet_address VARCHAR(42) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE CASCADE
);

-- Cache dei Risultati
CREATE TABLE results_cache (
    election_id UUID REFERENCES elections(id) ON DELETE CASCADE,
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    vote_count INTEGER DEFAULT 0,
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (election_id, candidate_id)
);

-- Indici per performance
CREATE INDEX idx_whitelist_email ON whitelist(email);
CREATE INDEX idx_whitelist_recovery ON whitelist(email, blinded_token_hash);
CREATE INDEX idx_candidates_election ON candidates(election_id);
CREATE INDEX idx_spent_vouchers_election_id ON spent_vouchers(election_id);

-- Utente Admin (username/email: admin, chiave privata: admin)
INSERT INTO administrators (username, password_hash) 
VALUES ('admin', 'admin');
