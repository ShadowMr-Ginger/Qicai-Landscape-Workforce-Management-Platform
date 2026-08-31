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

    private static final List<String> CANDIDATE_FONT_FILES = Arrays.asList(
            "/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc",
            "/usr/share/fonts/truetype/wqy/wqy-microhei.ttc",
            "/usr/share/fonts/truetype/wqy/WenQuanYiZenHei.ttf",
            "/usr/share/fonts/truetype/wqy/WenQuanYiMicroHei.ttf",
            "/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc",
            "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
            "/usr/share/fonts/truetype/noto/NotoSansSC-Regular.ttf",
            "/usr/share/fonts/truetype/noto/NotoSansSC-VF.ttf",
            "/usr/share/fonts/truetype/droid/DroidSansFallbackFull.ttf",
            "/usr/share/fonts/truetype/droid/DroidSansFallback.ttf",
            "/usr/share/fonts/truetype/arphic/uming.ttc",
            "/usr/share/fonts/truetype/arphic/ukai.ttc",
            "/usr/share/fonts/opentype/source-han-sans/SourceHanSansSC-Regular.otf",
            "/usr/share/fonts/truetype/source-han-sans/SourceHanSansSC-Regular.otf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
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
        // 1. 尝试已知的常见中文字体文件
        for (String path : CANDIDATE_FONT_FILES) {
            BaseFont bf = createBaseFontFromFile(path);
            if (bf != null) {
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

    private static BaseFont createBaseFontFromFile(String path) {
        File file = new File(path);
        if (!file.exists() || !file.isFile()) {
            return null;
        }
        String lower = path.toLowerCase();
        try {
            if (lower.endsWith(".ttc")) {
                // TrueType 字体集合，依次尝试前几个索引
                for (int i = 0; i < 4; i++) {
                    try {
                        BaseFont bf = BaseFont.createFont(path + "#" + i, ENCODING, EMBEDDED);
                        if (isCjkFont(bf)) {
                            return bf;
                        }
                    } catch (Exception ignored) {
                    }
                }
            } else {
                BaseFont bf = BaseFont.createFont(path, ENCODING, EMBEDDED);
                if (isCjkFont(bf)) {
                    return bf;
                }
            }
        } catch (Exception e) {
            log.debug("加载字体文件失败: {} - {}", path, e.getMessage());
        }
        return null;
    }

    private static boolean isCjkFont(BaseFont bf) {
        if (bf == null) {
            return false;
        }
        String name = bf.getPostscriptFontName();
        if (name == null) {
            return false;
        }
        String lower = name.toLowerCase();
        return lower.contains("cjk")
                || lower.contains("-sc-")
                || lower.endsWith(" sc")
                || lower.contains("sc regular")
                || lower.contains("sc bold")
                || lower.contains("sc vf")
                || lower.contains("cn")
                || lower.contains("tc")
                || lower.contains("wqy")
                || lower.contains("zenhei")
                || lower.contains("microhei")
                || lower.contains("noto")
                || lower.contains("source")
                || lower.contains("droid")
                || lower.contains("arphic")
                || lower.contains("uming")
                || lower.contains("ukai")
                || lower.contains("simhei")
                || lower.contains("simsun")
                || lower.contains("yahei")
                || lower.contains("heiti")
                || lower.contains("gkai")
                || lower.contains("gsung")
                || lower.contains("song");
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

        File bestFile = null;
        int bestScore = -1;
        for (File f : candidates) {
            String lower = f.getName().toLowerCase();
            if (!isCjkFontName(lower)) {
                continue;
            }
            int score = scoreFontFileName(lower);
            if (score > bestScore) {
                bestScore = score;
                bestFile = f;
            }
        }
        if (bestFile != null) {
            BaseFont bf = createBaseFontFromFile(bestFile.getAbsolutePath());
            if (bf != null) {
                return bf;
            }
        }

        // 按文件名得分从高到低尝试其他 CJK 字体
        candidates.sort((a, b) -> Integer.compare(scoreFontFileName(b.getName().toLowerCase()),
                scoreFontFileName(a.getName().toLowerCase())));
        for (File f : candidates) {
            BaseFont bf = createBaseFontFromFile(f.getAbsolutePath());
            if (bf != null) {
                return bf;
            }
        }
        return null;
    }

    private static boolean isCjkFontName(String lower) {
        return lower.contains("cjk") || lower.contains("-sc-") || lower.endsWith(" sc")
                || lower.contains("sc regular") || lower.contains("sc bold") || lower.contains("sc vf")
                || lower.contains("cn") || lower.contains("tc") || lower.contains("wqy")
                || lower.contains("zenhei") || lower.contains("microhei") || lower.contains("noto")
                || lower.contains("source") || lower.contains("droid") || lower.contains("arphic")
                || lower.contains("uming") || lower.contains("ukai") || lower.contains("simhei")
                || lower.contains("simsun") || lower.contains("yahei") || lower.contains("heiti")
                || lower.contains("gkai") || lower.contains("gsung") || lower.contains("song");
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
                    candidates.add(f);
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
}
