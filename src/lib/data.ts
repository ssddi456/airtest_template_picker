import { AnnotationData } from "../types";

export function isSameAnnotationData(a?: AnnotationData | null, b?: AnnotationData | null): boolean {
  if (!a || !b) return false;
  if (a.screenshotId !== b.screenshotId) return false;
  if (a.currentAnnotations.length !== b.currentAnnotations.length) return false;

  for (let i = 0; i < a.currentAnnotations.length; i++) {
    const annA = a.currentAnnotations[i];
    const annB = b.currentAnnotations[i];

    if (!annA || !annB) return false;

    if (
      annA.id !== annB.id ||
      annA.name !== annB.name ||
      annA.rect.x !== annB.rect.x ||
      annA.rect.y !== annB.rect.y ||
      annA.rect.width !== annB.rect.width ||
      annA.rect.height !== annB.rect.height ||
      annA.targetPos !== annB.targetPos
    ) {
      return false;
    }
  }

  return true;
}