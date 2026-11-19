# Pepkio Oligo QC Instant

Typed TypeScript and Node.js SDK with CLI for batch primer quality control, thermodynamic melting temperature calculation, and PCR primer pair matching via the Pepkio Tools API.

# What It Does

Designing primers for high-throughput genomics, multiplex PCR panels, and routine molecular cloning requires balancing melting temperatures, preventing secondary structures like hairpins and 3′-end primer dimers, and matching annealing conditions to specific reaction buffers.

This package provides a typed Node.js/ESM client and command-line interface to evaluate oligonucleotides via the Pepkio Tools REST API. It analyzes single primers, batch sequences (up to 100 primers), and forward/reverse primer pairs, computing nearest-neighbor thermodynamic melting temperatures ($T_m$), recommended annealing temperatures ($T_a$) across major DNA polymerases, and screening for secondary structure hazards.

Programmatic runs require an active network connection and a Pepkio API key. Calculations are processed via the Pepkio Tools REST API.

# Features

- **Polymerase-Specific Annealing Temperatures ($T_a$)**: Built-in buffer chemistry models for NEB Q5, Phusion, Standard Taq, KAPA HiFi, and custom buffer conditions
- **Forward & Reverse Pair Matching**: Computes individual $T_m$, pair $\Delta T_m$, 3′-end cross-dimerization, and recommended annealing temperature
- **High-Throughput Batch QC**: Validates up to 100 oligonucleotides simultaneously from FASTA strings, CSV/TSV data, or plain text
- **Multi-Method Tm Calculations**: Wallace rule, SantaLucia 1998 unified nearest-neighbor, and Owczarzy 2008 salt corrections
- **Secondary Structure Evaluation**: Flags intramolecular hairpins and 3′-end intermolecular dimers with $\Delta G$ predictions
- **Degenerate Base Support**: Handles IUPAC ambiguous nucleotide codes with appropriate thermodynamic weighting
- **Manifest and Example Inspection**: Inspect pre-configured examples using `getManifest`, `listExamples`, and `getExampleInput`
- **Command-Line Interface (CLI)**: Inspect manifests and run QC directly via `npx pepkio-oligo-qc-instant`
- **TypeScript & ESM Native**: Fully typed with runtime parameter validation powered by Zod

# Installation

```bash
npm install pepkio-oligo-qc-instant
```

Requires Node.js 18 or newer.

# Configuration

Set an API key with **tools:run** scope before calling `run()`:

```bash
export PEPKIO_API_KEY="your-api-key"
```

Create an API key in your [Pepkio account settings](https://www.pepkio.com/account/api-keys).

Optional configuration variables:

| Variable | Purpose |
|----------|---------|
| `PEPKIO_API_KEY` | Production API key (for remote API calls) |
| `LOCAL_PEPKIO_API_KEY` | Local development key when `PEPKIO_API_BASE_URL` points to `tools.localtest.me` |
| `PEPKIO_API_BASE_URL` | API base URL (default: `https://tools.pepkio.com`) |

# Quick Example

```typescript
import { PepkioClient } from "pepkio-oligo-qc-instant";

const client = new PepkioClient({ apiKey: process.env.PEPKIO_API_KEY });

// Evaluate a forward and reverse primer pair for Q5 Polymerase
const response = await client.qcPair({
  fwdSeq: "GAAGGTGAAGGTCGGAGTC",
  revSeq: "GAAGATGGTGATGGGATTTC",
  polymeraseId: "q5",
  name: "GAPDH",
});

if (response.result?.pair) {
  const pair = response.result.pair;
  console.log(`Status: ${pair.overall_status}`);
  console.log(`Recommended Ta: ${pair.recommended_ta} °C`);
  console.log(`Delta Tm: ${pair.delta_tm} °C`);
}
```

# CLI

```bash
# Inspect available manifest examples
npx pepkio-oligo-qc-instant manifest --examples

# Run a pre-configured manifest example
npx pepkio-oligo-qc-instant run --example pair_q5
```

# Typical Use Cases

- **PCR & RT-qPCR Primer Pair Screening**: Verify that candidate forward and reverse primers have compatible melting temperatures ($\Delta T_m \le 2^\circ\text{C}$) and no 3′-end cross-dimer formation
- **Multiplex PCR Panel Optimization**: Screen batch primer libraries for uniform annealing thermodynamics under specific buffer conditions
- **High-Fidelity Polymerase Setup**: Calculate accurate annealing temperatures for NEB Q5, Phusion, or KAPA HiFi master mixes
- **Oligo Synthesis Pre-Check**: Screen high-throughput 96-well plate orders for hairpin structures and GC extremes before purchasing

# Scientific Background

Thermodynamic melting temperatures are calculated using SantaLucia (1998) unified nearest-neighbor parameters coupled with Owczarzy (2008) monovalent and divalent salt corrections. Recommended annealing temperatures are derived from the minimum primer $T_m$ adjusted for polymerase buffer processivity: $T_a = \min(T_m^{\text{fwd}}, T_m^{\text{rev}}) - 5^\circ\text{C}$ (clamped to the polymerase's recommended operating range). Intermolecular alignments with $\Delta G < -2.0\text{ kcal/mol}$ overlapping the last 5 nucleotides of the 3′-end are flagged as high-risk primer-dimers.

# Web Application

For researchers who prefer a graphical interface, an interactive web version is available.

Web Application: https://www.pepkio.com/tools/oligo-qc-instant

The web application provides real-time hairpin and dimer visualization, batch sequence table import, and exportable QC reports.

# Documentation and Resources

GitHub Repository: https://github.com/pepkio/pepkio-oligo-qc-instant-js

Web Application: https://www.pepkio.com/tools/oligo-qc-instant

Python client (PyPI): https://pypi.org/project/pepkio-oligo-qc-instant/

# About Pepkio

Pepkio (https://www.pepkio.com/) develops software tools and bioinformatics solutions for life science researchers, including laboratory calculators and analysis services (https://www.pepkio.com/cro).

A semantic, AI-native version of this document in the K2F format is available at https://k2f.dev (https://k2f.dev/v/6e01ad307301af2ffd2911079b7f5fdc945ffc6801ce7bc538b89e6665291200)
