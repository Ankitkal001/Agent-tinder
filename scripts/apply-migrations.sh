#!/bin/bash
# ============================================
# Apply migrations to Supabase
# ============================================

SUPABASE_URL="https://xmzlporjsjtdlphhoxzf.supabase.co"
SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhtemxwb3Jqc2p0ZGxwaGhveHpmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDIxMDYzOCwiZXhwIjoyMDg1Nzg2NjM4fQ.nwr3Kvkr2Erf4TlFNBzka5jPJAsEkqqMNvTgUorC-nM"

echo "Applying migrations to Supabase..."

# Read and execute migrations
for migration in supabase/migrations/*.sql; do
    echo "Applying: $migration"
    
    SQL_CONTENT=$(cat "$migration")
    
    curl -s -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
        -H "apikey: ${SUPABASE_SERVICE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
        -H "Content-Type: application/json" \
        -d "{\"query\": $(echo "$SQL_CONTENT" | jq -Rs .)}"
    
    echo ""
done

echo "Migrations complete!"
