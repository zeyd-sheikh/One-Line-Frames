const ORIENTATION_RATIOS = Object.freeze({
  landscape: "16 / 10",
  portrait: "4 / 5",
  square: "1 / 1",
});

export function getImageAspectRatio(image = {}) {
  const width = Number(image.imageWidth ?? image.image_width);
  const height = Number(image.imageHeight ?? image.image_height);

  if (
    Number.isFinite(width) &&
    width > 0 &&
    Number.isFinite(height) &&
    height > 0
  ) {
    return `${width} / ${height}`;
  }

  return ORIENTATION_RATIOS[image.orientation] ?? ORIENTATION_RATIOS.landscape;
}

export function getImageFrameStyle(image) {
  return {
    "--image-aspect-ratio": getImageAspectRatio(image),
  };
}
