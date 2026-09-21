# Publication thumbnails

Downloaded from the existing publication links on 2026-09-15. Each image is the actual,
uncropped first page of its paper, including margins. The arXiv abstract pages were checked
to confirm that IDs match the existing website titles. No paper copy was changed.

## Sources

| PDF source | Asset under `assets/img/papers/` | Pixels | First-page version stamp |
|---|---|---|---|
| [2603.09517](https://arxiv.org/pdf/2603.09517) | `2603.09517.webp` | 432x611 | arXiv:2603.09517v1 [cs.CL] 10 Mar 2026 |
| [2602.12316](https://arxiv.org/pdf/2602.12316) | `2602.12316.webp` | 432x611 | arXiv:2602.12316v2 [cs.AI] 22 May 2026 |
| [2306.09983](https://arxiv.org/pdf/2306.09983) | `2306.09983.webp` | 432x559 | arXiv:2306.09983v3 [cs.LG] 19 Oct 2023 |
| [2305.19223](https://arxiv.org/pdf/2305.19223) | `2305.19223.webp` | 432x559 | arXiv:2305.19223v1 [cs.AI] 30 May 2023 |
| [2210.04610](https://arxiv.org/pdf/2210.04610) | `2210.04610.webp` | 432x559 | arXiv:2210.04610v5 [cs.AI] 10 Nov 2022 |
| [2204.14146v2](https://arxiv.org/pdf/2204.14146v2) | `2204.14146v2.webp` | 432x611 | arXiv:2204.14146v2 [cs.CL] 2 May 2022 |
| [2206.06761](https://arxiv.org/pdf/2206.06761) | `2206.06761.webp` | 432x559 | arXiv:2206.06761v4 [cs.CV] 8 Sep 2022 |
| [2101.12509](https://arxiv.org/pdf/2101.12509) | `2101.12509.webp` | 432x559 | arXiv:2101.12509v2 [cs.LG] 23 Feb 2021 |

## Transformation

- Download the canonical arXiv PDF; preserve the explicitly linked `2204.14146v2` version.
- Render **page 1 only** with Poppler `pdftoppm`, PNG, at 1296 pixels wide with proportional height.
- Downsample with ImageMagick to 432 pixels wide, strip metadata, encode WebP at quality 88.
- Desktop display width is 144 CSS pixels (3× source resolution); mobile display width is 64 pixels.
- Explicit image width/height attributes preserve each paper's actual page ratio. Images are lazy-loaded and decoded asynchronously.
- PDFs and intermediate PNGs stay outside the repo in `/tmp/zais-paper-thumbnails/`.

Reproduce an individual image (substitute its ID):

```sh
curl --fail --location https://arxiv.org/pdf/2603.09517 -o /tmp/2603.09517.pdf
pdftoppm -f 1 -singlefile -scale-to-x 1296 -scale-to-y -1 -png /tmp/2603.09517.pdf /tmp/2603.09517
magick /tmp/2603.09517.png -resize 432x -strip -quality 88 assets/img/papers/2603.09517.webp
```

## Existing content discrepancy

The current [GT-HarmBench abstract](https://arxiv.org/abs/2602.12316) (v2) reports 1,535
scenarios; the existing website summary reports 2,009. Thumbnail work preserves the website
summary for separate editorial review. Unversioned links can change as authors revise papers;
the table above records the version actually rendered.
