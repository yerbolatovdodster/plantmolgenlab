---
title: "What is population structure?"
description: "Why plants from different places differ genetically, how to measure it, and why ignoring structure can make breeding and genetic conclusions wrong."
layout: explainer
draft: true   # временно скрыто; чтобы вернуть — удалить эту строку
---

## Populations and structure

A **population** is a group of individuals that interbreed freely. A species usually consists of many populations: some are completely isolated, others exchange migrants. When exchange is incomplete, mutation, selection, drift and migration gradually make allele frequencies differ among populations. Such populations are **differentiated**, and the resulting pattern is **population structure**: individuals within a group are on average more closely related to each other than to individuals from other groups [1].

In crops, "populations" are often not only geographic groups but also breeding programmes, growth habits (winter vs spring), cultivar origin or landraces from different regions.

## The Wahlund effect: what happens when populations are mixed

Imagine we sampled two populations without knowing it and analyse them as one. Even if each population is in Hardy–Weinberg equilibrium, the pooled sample **has fewer heterozygotes than expected**. This is the Wahlund effect [1, 2]. The larger the difference in allele frequencies, the larger the deficit.

{{< popfig id="wahlund" caption="**Figure 1.** Each circle is a gene copy (allele A or a). With frequencies 0.8 and 0.2, the expected share of heterozygotes in the pooled “population” is 50%, but the observed share is 32%. Move the sliders: when frequencies are equal, the deficit disappears. Calculation after [1]." >}}

## FST: how different populations are

The heterozygote deficit can be turned into a convenient measure of differentiation, **FST** (Wright’s fixation index) [1, 3]. It is the share of variation due to differences *between* populations:

- **FST = 0** — allele frequencies are the same, no differentiation;
- **FST = 1** — populations are fixed for different alleles, and a pooled sample has no heterozygotes.

For the example in Figure 1, FST = 0.36. Differences are maintained by **genetic drift** (random changes in frequency, especially in small populations) and **selection**, while **migration** (pollen and seed exchange) evens them out. In Wright’s simplest island model the expected FST = 1 / (1 + 4Nm), where Nm is the number of migrants per generation [1, 3].

{{< popfig id="migration" caption="**Figure 2.** Even one migrant per generation noticeably reduces differences between populations. The formula is useful for intuition but not for estimating migration: it holds only at equilibrium and without spatial structure [1]." >}}

## How structure is detected

Often we do not know in advance how many groups a collection contains or which group each sample belongs to. Methods that find groups themselves are then used:

- **STRUCTURE, ADMIXTURE, sNMF** [4–6] try partitions of the samples into K groups and look for the one with the least deviation from Hardy–Weinberg and linkage equilibrium within groups. The result is each sample’s ancestry proportions from every group.
- **PCA** (principal component analysis) shows how samples are arranged relative to each other. The number of significant principal components is roughly K − 1 [1, 7].

{{< popfig id="detect" caption="**Figure 3.** An illustrative collection of three groups. At K = 2 two groups merge; at K = 4–5 the model starts splitting groups without clear reason. The best K is chosen by minimum cross-entropy (sNMF) or similar criteria [1, 6]." >}}

## Why it matters in agriculture

### False associations in GWAS

Mixing populations creates associations between alleles even on **different chromosomes** — “mixture” linkage disequilibrium [1]. If one group of cultivars comes from the north and heads late while another comes from the south and heads early, *any* marker whose frequency differs between north and south will appear “associated” with heading date. In a genome-wide association study (GWAS) this produces dozens of false signals.

{{< popfig id="gwas" caption="**Figure 4.** Illustrative example. Ignoring structure inflates p-values across the genome (inflation factor λ ≫ 1) and false peaks cross the threshold. Adding principal components (PCA) and a kinship matrix to the model leaves only the true signal [8, 9]." >}}

### Where else population structure matters

<div class="ps-cards">
<div class="ps-card">
<h4>Genomic selection</h4>
<p>Prediction accuracy drops when the training set and new lines belong to different groups. Structure is taken into account when building the training set.</p>
</div>
<div class="ps-card">
<h4>Choosing parents</h4>
<p>Crossing accessions from genetically distant groups produces more new allele combinations. FST and PCA help to choose such pairs.</p>
</div>
<div class="ps-card">
<h4>Genebanks and collections</h4>
<p>Structure analysis reveals mislabelled or contaminated samples [1] and duplicates, and helps to build a compact core collection.</p>
</div>
<div class="ps-card">
<h4>Local adaptation</h4>
<p>Genomic regions with unusually high FST between regions are candidates for genes of adaptation to climate and soils [1].</p>
</div>
<div class="ps-card">
<h4>Conservation of genetic resources</h4>
<p>For crop wild relatives and endemics, structure shows which populations are unique and need protection first [1].</p>
</div>
<div class="ps-card">
<h4>Cultivar origin and purity</h4>
<p>Assignment tests determine which group a sample belongs to and help to confirm its origin [1].</p>
</div>
</div>

## Important caveats

- **Populations are partly subjective.** The “best” K depends on the question; with hierarchical structure it helps to look at several values of K [1].
- **Ancestry proportions are not proof of hybridisation.** Mixed bars in ADMIXTURE/sNMF plots do not necessarily mean a sample came from a cross: shared ancestry looks the same [1].
- **The FST → Nm formula requires equilibrium.** Shared alleles may be inherited from a common ancestor rather than brought by migration [1].
- **Few samples or markers give unreliable results.** With small differences, structure can be “found” even when there is none [1].
- **Selfing species are different.** In wheat and barley high homozygosity comes from selfing, not only from structure, and the very notion of a population is more complicated [1].

## How to compute it in CropPopStructure

| Question | Analysis |
|---|---|
| How many groups are there and who belongs where? | PCA, sNMF (choice of K), DAPC |
| How different are the groups? | Pairwise FST, AMOVA |
| Who is related to whom? | Kinship, NJ tree |
| Are there unique alleles? | Private SNPs |
| Is the collection suitable for GWAS? | LD decay, kinship, PCA |

## References

1. Hahn M. W. *Molecular Population Genetics.* Sunderland, MA: Sinauer Associates / Oxford University Press, 2018. Ch. 5 “Population structure”.
2. Wahlund S. Zusammensetzung von Populationen und Korrelationserscheinungen vom Standpunkt der Vererbungslehre aus betrachtet. *Hereditas.* 1928;11:65–106.
3. Wright S. The genetical structure of populations. *Annals of Eugenics.* 1951;15:323–354.
4. Pritchard J. K., Stephens M., Donnelly P. Inference of population structure using multilocus genotype data. *Genetics.* 2000;155:945–959.
5. Alexander D. H., Novembre J., Lange K. Fast model-based estimation of ancestry in unrelated individuals. *Genome Research.* 2009;19:1655–1664.
6. Frichot E., Mathieu F., Trouillon T., Bouchard G., François O. Fast and efficient estimation of individual ancestry coefficients. *Genetics.* 2014;196:973–983.
7. Patterson N., Price A. L., Reich D. Population structure and eigenanalysis. *PLoS Genetics.* 2006;2:e190.
8. Price A. L., Patterson N. J., Plenge R. M., Weinblatt M. E., Shadick N. A., Reich D. Principal components analysis corrects for stratification in genome-wide association studies. *Nature Genetics.* 2006;38:904–909.
9. Yu J., Pressoir G., Briggs W. H., et al. A unified mixed-model method for association mapping that accounts for multiple levels of relatedness. *Nature Genetics.* 2006;38:203–208.
