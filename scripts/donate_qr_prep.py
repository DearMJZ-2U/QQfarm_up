"""从捐助海报（微信 / 支付宝）里裁出白色二维码卡片，生成站点与 README 复用的 PNG。

用法：
  python scripts/donate_qr_prep.py <微信海报> <支付宝海报> [--preview DIR]

海报结构固定：整片纯色底（微信绿 / 支付宝蓝）+ 内嵌白色圆角卡片。
定位方式：
  1. 逐行取最长连续白像素段，长度落在 [0.5W, 0.88W] 且左右都被彩色像素包住的行，
     视为「卡片行」——标题白字、底部 slogan 行的白段都会被长度/边界条件排除；
  2. 取白段最宽的那一行当种子行，得到卡片左右边界；
  3. 在卡片左侧留白带（left + 6% 宽）上纵向扫白像素，得到卡片上下边界；
  4. 裁出卡片后把圆角处的底色刷白，得到可直接放进弹窗/README 的白底方图。
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

WHITE_TH = 235       # 判定「白」的通道阈值
SAT_TH = 40          # 判定「彩色底」的饱和度阈值
CORNER_FILL = 0.16   # 圆角刷白区域边长占卡片宽的比例


def _longest_white_run(row_white: np.ndarray) -> tuple[int, int, int]:
    xs = np.flatnonzero(row_white)
    if xs.size == 0:
        return 0, 0, 0
    breaks = np.flatnonzero(np.diff(xs) > 1)
    starts = np.concatenate(([0], breaks + 1))
    ends = np.concatenate((breaks, [xs.size - 1]))
    lengths = xs[ends] - xs[starts] + 1
    k = int(np.argmax(lengths))
    return int(lengths[k]), int(xs[starts[k]]), int(xs[ends[k]])


def detect_card(path: Path) -> tuple[int, int, int, int]:
    a = np.asarray(Image.open(path).convert("RGB")).astype(int)
    h, w, _ = a.shape
    white = (a[:, :, 0] > WHITE_TH) & (a[:, :, 1] > WHITE_TH) & (a[:, :, 2] > WHITE_TH)
    colored = (a.max(axis=2) - a.min(axis=2)) > SAT_TH

    candidates = []
    for y in range(h):
        length, s, e = _longest_white_run(white[y])
        if not (0.50 * w < length < 0.88 * w and s > 12 and e < w - 15):
            continue
        if colored[y, max(0, s - 12):s - 1].any() and colored[y, e + 2:e + 13].any():
            candidates.append((y, length, s, e))
    if not candidates:
        raise SystemExit(f"未能在 {path.name} 中定位二维码卡片")

    seed_y, _, left, right = max(candidates, key=lambda t: t[1])
    # 卡片左侧留白带内部的一列：上下扫白像素，得到卡片顶/底
    xi = left + max(24, int(0.06 * (right - left)))
    top = seed_y
    while top > 0 and white[top - 1, xi]:
        top -= 1
    bottom = seed_y
    while bottom < h - 1 and white[bottom + 1, xi]:
        bottom += 1
    return left, top, right + 1, bottom + 1


def whiten_corners(img: Image.Image) -> Image.Image:
    img = img.convert("RGB")
    w, h = img.size
    draw = ImageDraw.Draw(img)
    for xy in ((0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)):
        ImageDraw.floodfill(img, xy, (255, 255, 255), thresh=60)
    # floodfill 会留下抗锯齿彩边，把四个圆角方块里的残余彩色像素一并刷白
    side = max(8, int(CORNER_FILL * w))
    a = np.asarray(img).copy()
    colored = (a.max(axis=2) - a.min(axis=2)) > 20
    for y0, x0 in ((0, 0), (0, w - side), (h - side, 0), (h - side, w - side)):
        block = colored[y0:y0 + side, x0:x0 + side]
        sub = a[y0:y0 + side, x0:x0 + side]
        sub[block] = 255
        a[y0:y0 + side, x0:x0 + side] = sub
    return Image.fromarray(a)


def main() -> None:
    args = [a for a in sys.argv[1:] if a != "--preview"]
    if len(args) != 2:
        raise SystemExit(__doc__)
    out_dir = Path(__file__).resolve().parent.parent / "public"
    out_dir.mkdir(parents=True, exist_ok=True)

    for src, dst_name in ((Path(args[0]), "donate-wechat.png"), (Path(args[1]), "donate-alipay.png")):
        src_img = Image.open(src).convert("RGB")
        box = detect_card(src)
        crop = whiten_corners(src_img.crop(box))
        out = out_dir / dst_name
        crop.save(out, format="PNG", optimize=True)
        print(f"{src.name}: {src_img.size} -> card box={box} crop={crop.size} -> {out.name} ({out.stat().st_size} B)")


if __name__ == "__main__":
    main()