# Raw File Library Flow

```text
WORKSPACE
  ↓
Upload ZIP / CSV / XLSX / JSON / Parquet / PDF / Image / Code
  ↓
Raw File Library
  ↓
Security Scan + Checksum + Metadata
  ↓
If ZIP: safe extract into workspace folder tree
  ↓
File Explorer
  ├─ Preview File
  ├─ Download
  ├─ Register Dataset
  ├─ Send to Data Profiling
  ├─ Create Task
  └─ Assign Owner
  ↓
Dataset Registry
  ↓
Data Preparation
```

Raw File Library owns unprocessed files and extracted archive assets. Dataset Registry owns governed dataset records.
