---
title: "Software"
description: "The lab's programs and web services for genomic data analysis."
apps:
  - name: "CropPopStructure"
    image: "images/software/croppopstructure.png"
    caption: "Results in CropPopStructure: PCA of a barley collection (interface demo, illustrative data)."
    text: |
      A web application for analysing the population structure of crop collections. Users upload a VCF with SNP genotypes and a population file, and the whole pipeline runs on the lab server: diversity, PCA, DAPC, sNMF, kinship, NJ tree, AMOVA, pairwise FST, private SNPs, marker density and LD decay.

      Plots appear in the browser as they are ready, results can be downloaded, and previous runs are saved.
    page: "/tools"
---

## Computational genetics and bioinformatics

We write software for processing SNP genotyping data. Analyses are written mostly in R, and the steps are combined into reproducible Nextflow pipelines. The main goal is reproducibility: the same steps, the same parameters and a clear report at the end.

That is why we wrap finished pipelines into web applications. Breeders and biologists can use them without programming skills, while the heavy computing runs on the lab server.
