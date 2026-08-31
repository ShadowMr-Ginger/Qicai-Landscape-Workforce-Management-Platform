package com.green.common.util;

import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.pdf.BaseFont;

import java.awt.*;
import java.io.File;
import java.util.Arrays;
import java.util.List;

/**
 * PDF 字体工具类
 * <p>优先加载系统已安装的中文字体，无可用中文字体时回退到 Helvetica（中文可能显示为方块）。</p>
 */
public final class PdfFontUtil {

    private static final List<String> CANDIDATE_FONT_NAMES = Arrays.asList(
            "WenQuanYi Zen Hei",
            "WenQuanYi Micro Hei",
            "Noto Sans CJK SC",
            "Noto Sans SC",
            "Source Han Sans SC",
            "Source Han Sans CN",
            "SimHei",
            "SimSun",
            "Microsoft YaHei",
            "Droid Sans Fallback",
            "AR PL UMing CN",
            "AR PL UKai CN"
    );

    private static final List<String> CANDIDATE_FONT_FILES = Arrays.asList(
            "/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc",
            "/usr/share/fonts/truetype/wqy/wqy-microhei.ttc",
            "/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc",
            "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
            "/usr/share/fonts/truetype/droid/DroidSansFallbackFull.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
    );

    private static volatile Font normalFont;
    private static volatile Font boldFont;
    private static volatile Font titleFont;

    static {
        registerSystemFonts();
    }

    private PdfFontUtil() {
    }

    private static void registerSystemFonts() {
        try {
            FontFactory.registerDirectories();
        } catch (Exception ignored) {
            // 某些环境可能无法遍历字体目录，忽略并尝试单独注册文件
        }
        for (String path : CANDIDATE_FONT_FILES) {
            File file = new File(path);
            if (file.exists() && file.isFile()) {
                try {
                    FontFactory.register(path);
                } catch (Exception ignored) {
                }
            }
        }
    }

    public static Font getNormalFont() {
        if (normalFont == null) {
            synchronized (PdfFontUtil.class) {
                if (normalFont == null) {
                    normalFont = createBestFont(10, Font.NORMAL, Color.BLACK);
                }
            }
        }
        return normalFont;
    }

    public static Font getBoldFont() {
        if (boldFont == null) {
            synchronized (PdfFontUtil.class) {
                if (boldFont == null) {
                    boldFont = createBestFont(11, Font.BOLD, Color.BLACK);
                }
            }
        }
        return boldFont;
    }

    public static Font getTitleFont() {
        if (titleFont == null) {
            synchronized (PdfFontUtil.class) {
                if (titleFont == null) {
                    titleFont = createBestFont(14, Font.BOLD, Color.BLACK);
                }
            }
        }
        return titleFont;
    }

    public static Font getFont(float size, int style, Color color) {
        return createBestFont(size, style, color);
    }

    private static Font createBestFont(float size, int style, Color color) {
        for (String name : CANDIDATE_FONT_NAMES) {
            try {
                Font font = FontFactory.getFont(name, BaseFont.IDENTITY_H, size, style, color);
                if (font.getBaseFont() != null) {
                    return font;
                }
            } catch (Exception ignored) {
            }
        }
        for (String path : CANDIDATE_FONT_FILES) {
            File file = new File(path);
            if (file.exists() && file.isFile()) {
                try {
                    return FontFactory.getFont(path, BaseFont.IDENTITY_H, size, style, color);
                } catch (Exception ignored) {
                }
            }
        }
        return FontFactory.getFont(FontFactory.HELVETICA, size, style, color);
    }
}
