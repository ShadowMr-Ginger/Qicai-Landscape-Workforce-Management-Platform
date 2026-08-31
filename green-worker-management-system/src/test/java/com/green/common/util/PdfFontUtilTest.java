package com.green.common.util;

import com.lowagie.text.Document;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfWriter;
import org.junit.jupiter.api.Test;

import java.io.FileOutputStream;

import static org.junit.jupiter.api.Assertions.assertTrue;

class PdfFontUtilTest {

    @Test
    void testCreatePdfWithChinese() throws Exception {
        String path = "target/chinese-test.pdf";
        try (FileOutputStream out = new FileOutputStream(path)) {
            Document doc = new Document();
            PdfWriter.getInstance(doc, out);
            doc.open();
            doc.add(new Paragraph("中文测试 页计 总计 2024年8月", PdfFontUtil.getTitleFont()));
            doc.add(new Paragraph("这是一段普通中文文本。", PdfFontUtil.getNormalFont()));
            doc.close();
        }
        java.io.File file = new java.io.File(path);
        assertTrue(file.exists() && file.length() > 0);
        System.out.println("PDF generated: " + file.getAbsolutePath() + ", size: " + file.length());
    }
}
