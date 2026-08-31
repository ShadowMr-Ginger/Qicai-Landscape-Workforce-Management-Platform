package com.green.common.util;

import com.lowagie.text.Font;
import com.lowagie.text.pdf.BaseFont;
import lombok.extern.slf4j.Slf4j;

import java.awt.*;
import java.io.File;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * PDF 字体工具类
 * <p>优先加载系统已安装的中文字体，无可用中文字体时回退到 Helvetica（中文可能显示为方块）。</p>
 */
@Slf4j
public final class PdfFontUtil {

    private static final String ENCODING = BaseFont.IDENTITY_H;
    private static final boolean EMBEDDED = false;

    /**
     * 已知中文字体文件清单（路径 + TTC 索引，普通 TTF/OTF 索引为 -1）。
     * 越靠前的字体越优先使用。
     */
    private static final List<FontCandidate> CANDIDATE_FONT_FILES = Arrays.asList(
            // WenQuanYi 正黑，常见 Linux 发行版默认中文字体
            new FontCandidate("/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc", 0),
            new FontCandidate("/usr/share/fonts/truetype/wqy/wqy-microhei.ttc", 0),
            // Noto Sans CJK SC（index 2 为简体中文）
            new FontCandidate("/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc", 2),
            new FontCandidate("/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc", 2),
            new FontCandidate("/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc", 2),
            new FontCandidate("/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc", 0),
            new FontCandidate("/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc", 0),
            // Noto Serif CJK SC
            new FontCandidate("/usr/share/fonts/opentype/noto/NotoSerifCJK-Regular.ttc", 2),
            new FontCandidate("/usr/share/fonts/opentype/noto/NotoSerifCJK-Bold.ttc", 2),
            // Noto Sans SC 单独字体文件
            new FontCandidate("/usr/share/fonts/truetype/noto/NotoSansSC-Regular.ttf", -1),
            new FontCandidate("/usr/share/fonts/truetype/noto/NotoSansSC-VF.ttf", -1),
            new FontCandidate("/usr/share/fonts/opentype/noto/NotoSansSC-Regular.ttf", -1),
            // Droid Sans Fallback
            new FontCandidate("/usr/share/fonts/truetype/droid/DroidSansFallbackFull.ttf", -1),
            new FontCandidate("/usr/share/fonts/truetype/droid/DroidSansFallback.ttf", -1),
            // AR PL 字体
            new FontCandidate("/usr/share/fonts/truetype/arphic/uming.ttc", 0),
            new FontCandidate("/usr/share/fonts/truetype/arphic/ukai.ttc", 0),
            // Source Han Sans SC
            new FontCandidate("/usr/share/fonts/opentype/source-han-sans/SourceHanSansSC-Regular.otf", -1),
            new FontCandidate("/usr/share/fonts/truetype/source-han-sans/SourceHanSansSC-Regular.otf", -1),
            // Windows 常见中文字体
            new FontCandidate("C:/Windows/Fonts/simsun.ttc", 0),
            new FontCandidate("C:/Windows/Fonts/simhei.ttf", -1),
            new FontCandidate("C:/Windows/Fonts/msyh.ttc", 0),
            new FontCandidate("C:/Windows/Fonts/msyhbd.ttc", 0),
            new FontCandidate("C:/Windows/Fonts/DroidSansFallback.ttf", -1),
            new FontCandidate("C:/Windows/Fonts/NotoSansCJK-Regular.ttc", 2),
            // macOS 常见中文字体
            new FontCandidate("/System/Library/Fonts/PingFang.ttc", 0),
            new FontCandidate("/Library/Fonts/Arial Unicode.ttf", -1)
    );

    private static final List<String> SCAN_DIRECTORIES = Arrays.asList(
            "/usr/share/fonts",
            "/usr/local/share/fonts",
            "/System/Library/Fonts",
            "/Library/Fonts",
            "C:/Windows/Fonts"
    );

    private static volatile BaseFont baseFont;
    private static volatile Font normalFont;
    private static volatile Font boldFont;
    private static volatile Font titleFont;

    static {
        initialize();
    }

    private PdfFontUtil() {
    }

    private static void initialize() {
        baseFont = findChineseBaseFont();
        if (baseFont == null) {
            log.warn("未找到系统中文字体，PDF 中文将可能显示为方块，请在服务器安装中文字体（如 fonts-noto-cjk 或 fonts-wqy-zenhei）");
            try {
                baseFont = BaseFont.createFont(BaseFont.HELVETICA, BaseFont.CP1252, true);
            } catch (Exception e) {
                log.error("加载 Helvetica 回退字体失败", e);
            }
        } else {
            log.info("PDF 中文字体已加载: {}", baseFont.getPostscriptFontName());
        }
    }

    private static BaseFont findChineseBaseFont() {
        // 1. 尝试已知的常见中文字体文件（按精确路径 + 索引）
        for (FontCandidate candidate : CANDIDATE_FONT_FILES) {
            BaseFont bf = createBaseFont(candidate.path, candidate.ttcIndex);
            if (bf != null) {
                log.debug("通过候选清单加载字体: {} (index={})", candidate.path, candidate.ttcIndex);
                return bf;
            }
        }

        // 2. 扫描常见字体目录，查找包含 CJK/SC/CN 关键字的字体
        for (String dir : SCAN_DIRECTORIES) {
            BaseFont bf = scanDirectory(new File(dir));
            if (bf != null) {
                return bf;
            }
        }

        return null;
    }

    private static BaseFont createBaseFont(String path, int ttcIndex) {
        File file = new File(path);
        if (!file.exists() || !file.isFile()) {
            return null;
        }
        String fontName = ttcIndex >= 0 ? path + "," + ttcIndex : path;
        try {
            BaseFont bf = BaseFont.createFont(fontName, ENCODING, EMBEDDED);
            if (bf != null && bf.getPostscriptFontName() != null) {
                return bf;
            }
        } catch (Exception e) {
            log.debug("加载字体失败: {} (index={}) - {}", path, ttcIndex, e.getMessage());
        }
        return null;
    }

    private static BaseFont scanDirectory(File dir) {
        if (dir == null || !dir.exists() || !dir.isDirectory()) {
            return null;
        }
        File[] files = dir.listFiles();
        if (files == null) {
            return null;
        }
        List<File> candidates = new ArrayList<>();
        collectFontFiles(files, candidates);

        // 按文件名得分从高到低排序
        candidates.sort((a, b) -> Integer.compare(scoreFontFileName(b.getName().toLowerCase()),
                scoreFontFileName(a.getName().toLowerCase())));

        for (File f : candidates) {
            String lower = f.getName().toLowerCase();
            int ttcIndex = -1;
            if (lower.endsWith(".ttc")) {
                // 对 CJK 字体集合，优先尝试简体中文索引（通常靠后），再尝试 0
                ttcIndex = guessBestTtcIndex(f.getName());
            }
            if (ttcIndex >= 0) {
                BaseFont bf = createBaseFont(f.getAbsolutePath(), ttcIndex);
                if (bf != null) {
                    log.debug("扫描加载字体: {} (index={})", f.getAbsolutePath(), ttcIndex);
                    return bf;
                }
                // 若最佳索引失败，再尝试 0
                bf = createBaseFont(f.getAbsolutePath(), 0);
                if (bf != null) {
                    log.debug("扫描加载字体: {} (index=0)", f.getAbsolutePath());
                    return bf;
                }
            } else {
                BaseFont bf = createBaseFont(f.getAbsolutePath(), -1);
                if (bf != null) {
                    log.debug("扫描加载字体: {}", f.getAbsolutePath());
                    return bf;
                }
            }
        }
        return null;
    }

    private static int guessBestTtcIndex(String fileName) {
        String lower = fileName.toLowerCase();
        if (lower.contains("sc") || lower.contains("cn")) return 2;
        if (lower.contains("tc")) return 3;
        if (lower.contains("kr")) return 1;
        if (lower.contains("jp")) return 0;
        return 0;
    }

    private static boolean isCjkFontName(String lower) {
        return lower.contains("cjk") || lower.contains("-sc-") || lower.endsWith(" sc")
                || lower.contains("sc regular") || lower.contains("sc bold") || lower.contains("sc vf")
                || lower.contains("cn") || lower.contains("tc") || lower.contains("wqy")
                || lower.contains("wenquanyi") || lower.contains("zenhei") || lower.contains("zenkai")
                || lower.contains("microhei") || lower.contains("noto") || lower.contains("source")
                || lower.contains("droid") || lower.contains("arphic")
                || lower.contains("uming") || lower.contains("ukai") || lower.contains("simhei")
                || lower.contains("simsun") || lower.contains("yahei") || lower.contains("heiti")
                || lower.contains("gkai") || lower.contains("gsung") || lower.contains("song")
                || lower.contains("fangsong") || lower.contains("kaiti")
                || lower.contains("pingfang") || lower.contains("unicode");
    }

    private static int scoreFontFileName(String lower) {
        int score = 0;
        if (lower.contains("regular")) score += 100;
        if (lower.contains("medium")) score += 90;
        if (lower.contains("bold")) score += 80;
        if (lower.contains("normal")) score += 70;
        if (lower.contains("cjk")) score += 50;
        if (lower.contains("sc")) score += 40;
        if (lower.contains("wqy")) score += 40;
        if (lower.contains("zenhei")) score += 40;
        if (lower.contains("noto")) score += 30;
        if (lower.contains("pingfang")) score += 30;
        if (lower.contains("thin")) score -= 100;
        if (lower.contains("light")) score -= 50;
        if (lower.contains("extralight")) score -= 80;
        return score;
    }

    private static void collectFontFiles(File[] files, List<File> candidates) {
        for (File f : files) {
            if (f.isDirectory()) {
                File[] children = f.listFiles();
                if (children != null) {
                    collectFontFiles(children, candidates);
                }
            } else if (f.isFile()) {
                String lower = f.getName().toLowerCase();
                if (lower.endsWith(".ttf") || lower.endsWith(".ttc") || lower.endsWith(".otf")) {
                    if (isCjkFontName(lower)) {
                        candidates.add(f);
                    }
                }
            }
        }
    }

    private static Font createFont(float size, int style, Color color) {
        if (baseFont == null) {
            return new Font(Font.HELVETICA, size, style, color);
        }
        return new Font(baseFont, size, style, color);
    }

    public static Font getNormalFont() {
        if (normalFont == null) {
            synchronized (PdfFontUtil.class) {
                if (normalFont == null) {
                    normalFont = createFont(10, Font.NORMAL, Color.BLACK);
                }
            }
        }
        return normalFont;
    }

    public static Font getBoldFont() {
        if (boldFont == null) {
            synchronized (PdfFontUtil.class) {
                if (boldFont == null) {
                    boldFont = createFont(11, Font.BOLD, Color.BLACK);
                }
            }
        }
        return boldFont;
    }

    public static Font getTitleFont() {
        if (titleFont == null) {
            synchronized (PdfFontUtil.class) {
                if (titleFont == null) {
                    titleFont = createFont(14, Font.BOLD, Color.BLACK);
                }
            }
        }
        return titleFont;
    }

    public static Font getFont(float size, int style, Color color) {
        return createFont(size, style, color);
    }

    private static class FontCandidate {
        final String path;
        final int ttcIndex;

        FontCandidate(String path, int ttcIndex) {
            this.path = path;
            this.ttcIndex = ttcIndex;
        }
    }
}
