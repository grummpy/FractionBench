# Thirty-case review checklist

Reviewer for this file: the coding agent that implemented the checker, using BigInt rationals and integer cross-products, then the automated fixture in `tests/reviewCases.ts`.

This is not an educator review. A tutor or content owner still needs to review all 30 cases before real learner use. That review is pending. It is a release gate.

Do not weaken an expected result to make a test pass. If a case below disagrees with a later tutor review, change the product only after that review writes the new expectation down.

## Completion policy used by these expectations

`complete` means the last line meets the requested form, its value equals the start, at least one step changed the expression without being blocked, and no step is a mathematical error or invalid input.

An `equivalent_unverified_reason` does not by itself block `complete`. The feedback still focuses that step. A star can show while the reason note stays on screen. A tutor may want a stricter rule; it is called out here so it is not silent.

A correct last line after an earlier mathematical error does not make the solution valid (case 20).

## Cases

1. 1/2 → 2/4, equivalent rewrite. Status verified. Final value correct. Complete.
2. 2/3 → 6/9, equivalent rewrite. Status verified. Final value correct. Complete.
3. 4/6 → 2/3, divide by 2. Status verified. Simplest form. Complete.
4. 1/2 → 3/6 → 6/12, equivalent rewrites. Both verified. Final value correct. Complete.
5. 1/2 → 2/3. Mathematical error at transition 1. Final value not correct. Not complete.
6. 2/3 → 2/6. Mathematical error at transition 1. Not complete.
7. 1/2 → 2/4 with scale factor 3. Value preserved, reason unverified. Not a mathematical error. Form is an equivalent fraction, so complete is true and the reason stays in focus.
8. 3/6 → 1/2 with division factor 2. Value preserved, reason unverified. 1/2 is simplest, so complete is true and the reason stays in focus.
9. 1/2 → 1/2. Value preserved, no progress. Not complete.
10. E01 ending at 3/6. The step is a verified equivalent. Value correct. Denominator 4 is unmet. Not complete.
11. E05 with no added step, so the work ends at 4/6. Value correct. Simplest form is unmet. Not complete.
12. 1/4 + 2/4 → 3/4, combine. Verified. Complete.
13. 1/4 + 2/4 → 3/8. Mathematical error at transition 1. The message says the values differ and talks about denominators as part size.
14. 1/2 + 1/3 → 3/6 + 2/6 → 5/6. Both verified. Complete.
15. 1/2 + 1/3 → 6/12 + 4/12 → 10/12. Both verified. Unreduced final accepted. Complete.
16. 1/2 + 1/3 → 1/3 + 1/2 → 5/6. Reorder verified. Direct sum verified as a correct equivalent result. Complete.
17. 2/4 + 1/4 → 1/2 + 1/4 → 3/4. Simplify-first path accepted. Complete.
18. 1/2 + 1/3 → 2/6 + 2/6 → 4/6. Mathematical error at transition 1. The second step is not judged.
19. 1/2 + 1/3 → 3/6 + 2/6 → 6/6. Verified, then mathematical error at transition 2.
20. 1/2 + 1/3 → 2/5 → 5/6. Mathematical error at transition 1. The second step is not judged. The last line's value matches the original sum, and the solution is still not complete.
21. 1/2 + 1/3 → 5/6 claimed as combine-like-denominators. Value correct, reason unverified. Complete, with the reason still in focus.
22. 1/2 + 1/3 → 1/4 + 7/12 with an equivalent-rewrite reason. Total preserved, term rewrites unsupported. Not complete, because the line is still a sum.
23. Case 22 followed by → 1/1. Reason warning on transition 1. Mathematical error at transition 2.
24. 3/4 + 2/3 → 9/12 + 8/12 → 17/12. Improper answer accepted. Complete.
25. 5/6 + 1/3 → 5/6 + 2/6 → 7/6. Valid beyond one whole. Complete.
26. 0/4 → 0/7. Equivalent zero. Verified. No denominator-zero confusion.
27. A row containing 1/0. Invalid input. Not a mathematical error.
28. Numerator 1.5 and a blank denominator. Invalid input. The message names 1.5 and the missing denominator.
29. 1/2 + 1/3 → 3/6 + 2/6 and stop. Verified work. Addition unfinished. Not complete.
30. 1/2 → 6/12 → 3/4. Transition 1 verified. Mathematical error at transition 2. The valid prefix stays verified.

## Method

Each transition was compared with exact cross-products. Supported reasons were checked against the written integers, not against a single answer string. The fixture test fails if a status, the first mathematical-error transition, the final-value flag, or the complete flag drifts.
