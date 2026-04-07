from PIL import Image
import os

assets = r'C:\Users\E23517\BaceCampApp\src\assets\image'

def remove_white_bg(src_path, dst_path, threshold=235):
    """Remove white/near-white background, keep everything else."""
    img = Image.open(src_path).convert('RGBA')
    data = img.getdata()
    new_data = []
    for r, g, b, a in data:
        if r >= threshold and g >= threshold and b >= threshold:
            new_data.append((r, g, b, 0))
        else:
            new_data.append((r, g, b, a))
    img.putdata(new_data)
    img.save(dst_path, 'PNG')
    print(f'Saved: {dst_path}')

def make_light_version(src_path, dst_path, white_threshold=235):
    """
    For use on dark backgrounds (e.g. dark green hero):
    - White/near-white outer background  -> fully transparent
    - Light blue court lines             -> faint white (20 alpha) — subtle texture
    - Dark/black text pixels             -> white (using luminance, handles anti-aliasing)
    - Green ACE pixels                   -> bright lime green (pops on dark bg)
    """
    img = Image.open(src_path).convert('RGBA')
    data = img.getdata()
    new_data = []
    for r, g, b, a in data:
        # Luminance (perceptual brightness)
        luma = 0.299 * r + 0.587 * g + 0.114 * b

        # White / near-white background -> fully transparent
        if r >= white_threshold and g >= white_threshold and b >= white_threshold:
            new_data.append((0, 0, 0, 0))

        # Light blue court lines: blue dominant, not too dark, not white
        elif b > r + 25 and b > g and luma > 140 and luma < white_threshold:
            # Keep blue court colour — boost brightness so it pops on dark green
            new_data.append((80, 180, 255, 220))

        # Green pixels (ACE text) -> keep green, slightly brighter for dark bg
        elif g > r + 40 and g > b + 40:
            new_data.append((0, 220, 60, 255))

        # Dark pixels (black text + anti-aliased edges) -> white
        # Map dark pixels to white preserving their alpha for smooth edges
        elif luma < 180:
            # Anti-aliasing: the darker the pixel the more opaque the white
            white_alpha = int(255 * (1.0 - luma / 180.0))
            new_data.append((255, 255, 255, min(255, white_alpha + 80)))

        else:
            new_data.append((r, g, b, 0))  # everything else transparent

    img.putdata(new_data)
    img.save(dst_path, 'PNG')
    print(f'Saved: {dst_path}')

# 1. Transparent bg version (dark text + green ACE) - for light/white backgrounds
remove_white_bg(
    os.path.join(assets, 'bACE_CAMP-logo.png'),
    os.path.join(assets, 'bACE_CAMP-logo-transparent.png')
)

# 2. Light/white text version - for dark green hero backgrounds
make_light_version(
    os.path.join(assets, 'bACE_CAMP-logo.png'),
    os.path.join(assets, 'bACE_CAMP-logo-light.png')
)

print('Done.')
