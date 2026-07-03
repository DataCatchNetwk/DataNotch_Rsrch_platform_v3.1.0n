#!/usr/bin/env bash
set -e
cat > /tmp/demo_datanotch.csv <<CSV
Patient Name,Age,DOB,Visit Date,Score,Email
Jane Doe,43,1983-01-02,05/01/2026,92,jane@example.com
Jane Doe,43,1983-01-02,05/01/2026,92,jane@example.com
John Smith,,1980-03-04,2026-05-02,88,john@example.com
CSV
curl -F "file=@/tmp/demo_datanotch.csv" -F "name=Clinical SDOH Demo" http://localhost:4000/api/datasets/upload
