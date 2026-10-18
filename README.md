# AI Quality Lab

AI Quality Lab is a decision-support product for evaluating whether an ML system is ready to launch. The first module, **Decision Threshold Explorer**, connects model scores to operating capacity and business cost.

## Current module

The explorer generates a reproducible imbalanced-classification scenario and lets a reviewer change:

- positive-class prevalence;
- decision threshold;
- false-positive and false-negative costs;
- maximum review capacity.

It calculates the confusion matrix, accuracy, precision, recall, F1, PR-AUC, alert volume, expected cost, and cost improvement over an all-negative baseline. Transparent quality, economics, and capacity gates produce a `Pass`, `Conditional pass`, or `Stop` recommendation.

## Run locally

From this directory:

```bash
python3 -m http.server 8765 --directory dist
```

Then open `http://localhost:8765`.

## Test

```bash
/Users/ayushsoni21/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test tests/metrics.test.mjs
```

## Scope boundary

This is a new, standalone learning product. It does not read from, write to, import, or modify the existing RAG project.

