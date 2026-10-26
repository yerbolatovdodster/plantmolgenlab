---
title: "CropPopStructure"
description: "Population structure, from VCF to figures. Upload a VCF and a population file: the whole pipeline runs on the lab server and every figure appears in your browser as soon as it is ready."
analyses_title: "What it computes"
analyses:
  - { name: "Diversity", text: "Heterozygosity, polymorphism and other diversity statistics per population." }
  - { name: "PCA", text: "Principal component analysis: how samples cluster by genotype." }
  - { name: "DAPC", text: "Discriminant analysis of principal components to separate groups." }
  - { name: "sNMF", text: "Ancestry proportions for K = 2–8, with K chosen by cross-entropy." }
  - { name: "Kinship", text: "Genetic relatedness matrix between samples." }
  - { name: "NJ tree", text: "Neighbour-joining tree from genetic distances." }
  - { name: "AMOVA", text: "Share of variation within and between populations." }
  - { name: "Pairwise FST", text: "Genetic differentiation for every pair of populations." }
  - { name: "Private SNPs", text: "Alleles found in only one population." }
  - { name: "SNP density", text: "Marker distribution along the chromosomes." }
  - { name: "LD decay", text: "How linkage disequilibrium decays with distance." }
formats: |
  ## Input data

  **VCF** — `.vcf` or `.vcf.gz` with SNP genotypes. HapMap data can be converted in the **HapMap → VCF** tab.

  **Population file** — two tab-separated columns, no quotes, one sample per line:

  ```
  Kazakhstan	KZ_001
  Kazakhstan	KZ_002
  Russia	RU_014
  ```
---

## How to use it

1. Open the app and sign in with your account.
2. Upload a VCF and a population file and name the run.
3. Check the **Input check** box: number of samples, populations and SNPs.
4. Click **Run analysis** and follow the progress.
5. View and download figures and tables in the **Results** tab. Previous runs are kept.

## Access

Accounts are issued on request. Write to us with who you are and what data you plan to analyse.
