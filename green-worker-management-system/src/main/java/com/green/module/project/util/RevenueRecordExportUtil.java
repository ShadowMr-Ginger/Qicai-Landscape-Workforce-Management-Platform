package com.green.module.project.util;

import com.green.common.util.PdfFontUtil;
import com.green.module.project.vo.RevenueRecordVO;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.xwpf.usermodel.*;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.CTDecimalNumber;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.CTHMerge;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.CTPageMar;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.CTSectPr;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.STMerge;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.CTTblWidth;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.CTTcPr;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.CTVerticalJc;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.STTblWidth;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.STVerticalJc;

import java.awt.Color;
import java.io.IOException;
import java.io.OutputStream;
import java.math.BigDecimal;
import java.math.BigInteger;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;

/**
 * 营业记录导出工具类（Word/Excel）
 */
public class RevenueRecordExportUtil {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("M月d日");
    private static final String[] HEADERS = {"日期", "服务名称", "数量", "单价", "金额", "备注"};

    // Word 每页数据行数（标题、表头、页计、总计另行计算）
    private static final int WORD_ROWS_PER_PAGE = 18;
    // 行高：1cm = 567 twips
    private static final int ROW_HEIGHT_TWIPS = 567;
    // A4 宽度 11906 dxa，左右边距各 2cm（1134 dxa），可用宽度约 9638 dxa
    private static final int WORD_TABLE_WIDTH = 9638;
    // 列宽（DXA），按比例缩放以适应页面
    private static final int[] WORD_COL_WIDTHS = {1495, 2990, 997, 1163, 1163, 1830};

    /**
     * 导出 Word
     */
    public static void exportWord(List<RevenueRecordVO> records, String projectName,
                                  LocalDate startDate, LocalDate endDate, OutputStream out) throws IOException {
        List<RevenueRecordVO> sorted = sortByDate(records);
        String title = buildTitle(startDate, endDate, projectName);
        try (XWPFDocument doc = new XWPFDocument()) {
            setPageMargins(doc);
            XWPFTable currentTable = createWordTable(doc, title);
            int currentPageRows = 0;
            BigDecimal pageAmount = BigDecimal.ZERO;
            BigDecimal totalAmount = BigDecimal.ZERO;

            for (RevenueRecordVO record : sorted) {
                int recordRows = record.getItems() == null ? 0 : record.getItems().size();
                if (recordRows == 0) continue;

                // 如果当前页放不下这条记录，则结束本页并新建一页
                if (currentPageRows > 0 && currentPageRows + recordRows > WORD_ROWS_PER_PAGE) {
                    addPageTotalRow(currentTable, pageAmount);
                    addPageBreak(doc);
                    currentTable = createWordTable(doc, title);
                    currentPageRows = 0;
                    pageAmount = BigDecimal.ZERO;
                }

                List<RevenueRecordVO.RevenueRecordItemVO> items = record.getItems();
                for (int i = 0; i < items.size(); i++) {
                    RevenueRecordVO.RevenueRecordItemVO item = items.get(i);
                    XWPFTableRow row = currentTable.createRow();
                    setRowHeight(row);

                    // 日期：仅该记录第1行显示
                    setCellText(row.getCell(0), i == 0 ? formatDate(record.getRecordDate()) : "");
                    // 服务名称 + 四个空格 + 类型
                    String typeText = item.getWorkerTypeText() == null ? "" : item.getWorkerTypeText();
                    String serviceName = (item.getServiceName() == null ? "" : item.getServiceName())
                            + "    " + typeText;
                    setCellText(row.getCell(1), serviceName);
                    setCellText(row.getCell(2), item.getQuantity() == null ? "" : String.valueOf(item.getQuantity()));
                    setCellText(row.getCell(3), item.getUnitPrice() == null ? "" : formatAmount(item.getUnitPrice()));
                    setCellText(row.getCell(4), item.getTotalPrice() == null ? "" : formatAmount(item.getTotalPrice()));
                    setCellText(row.getCell(5), item.getRemark() == null ? "" : item.getRemark());

                    currentPageRows++;
                    pageAmount = pageAmount.add(item.getTotalPrice() == null ? BigDecimal.ZERO : item.getTotalPrice());
                    totalAmount = totalAmount.add(item.getTotalPrice() == null ? BigDecimal.ZERO : item.getTotalPrice());
                }
            }

            // 最后一页：页计、空行、总计
            addPageTotalRow(currentTable, pageAmount);
            addEmptyRow(currentTable);
            addTotalRow(currentTable, totalAmount);

            doc.write(out);
        }
    }

    /**
     * 导出 Excel
     */
    public static void exportExcel(List<RevenueRecordVO> records, String projectName,
                                   LocalDate startDate, LocalDate endDate, OutputStream out) throws IOException {
        List<RevenueRecordVO> sorted = sortByDate(records);
        String title = buildTitle(startDate, endDate, projectName);
        try (Workbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("营业记录");
            // 设置列宽（单位：1/256 字符宽度）
            sheet.setColumnWidth(0, 14 * 256);
            sheet.setColumnWidth(1, 28 * 256);
            sheet.setColumnWidth(2, 10 * 256);
            sheet.setColumnWidth(3, 12 * 256);
            sheet.setColumnWidth(4, 12 * 256);
            sheet.setColumnWidth(5, 18 * 256);

            CellStyle titleStyle = createExcelTitleStyle(wb);
            CellStyle headerStyle = createExcelHeaderStyle(wb);
            CellStyle dataStyle = createExcelDataStyle(wb);
            CellStyle totalStyle = createExcelTotalStyle(wb);
            CellStyle moneyStyle = createExcelMoneyStyle(wb, dataStyle);

            // 标题行（合并所有列）
            Row titleRow = sheet.createRow(0);
            titleRow.setHeightInPoints(28.35f);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue(title);
            titleCell.setCellStyle(titleStyle);
            sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(0, 0, 0, HEADERS.length - 1));

            // 表头
            Row headerRow = sheet.createRow(1);
            headerRow.setHeightInPoints(28.35f); // 1cm
            for (int i = 0; i < HEADERS.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(HEADERS[i]);
                cell.setCellStyle(headerStyle);
            }

            BigDecimal totalAmount = BigDecimal.ZERO;
            int rowIdx = 2;

            for (RevenueRecordVO record : sorted) {
                if (record.getItems() == null) continue;
                List<RevenueRecordVO.RevenueRecordItemVO> items = record.getItems();
                for (int i = 0; i < items.size(); i++) {
                    RevenueRecordVO.RevenueRecordItemVO item = items.get(i);
                    Row row = sheet.createRow(rowIdx++);
                    row.setHeightInPoints(28.35f);

                    Cell dateCell = row.createCell(0);
                    dateCell.setCellValue(i == 0 ? formatDate(record.getRecordDate()) : "");
                    dateCell.setCellStyle(dataStyle);

                    String typeText = item.getWorkerTypeText() == null ? "" : item.getWorkerTypeText();
                    String serviceName = (item.getServiceName() == null ? "" : item.getServiceName())
                            + "    " + typeText;
                    Cell nameCell = row.createCell(1);
                    nameCell.setCellValue(serviceName);
                    nameCell.setCellStyle(dataStyle);

                    Cell qtyCell = row.createCell(2);
                    qtyCell.setCellValue(item.getQuantity() == null ? 0 : item.getQuantity());
                    qtyCell.setCellStyle(dataStyle);

                    Cell priceCell = row.createCell(3);
                    if (item.getUnitPrice() != null) {
                        priceCell.setCellValue(item.getUnitPrice().doubleValue());
                    }
                    priceCell.setCellStyle(dataStyle);

                    Cell amountCell = row.createCell(4);
                    if (item.getTotalPrice() != null) {
                        amountCell.setCellValue(item.getTotalPrice().doubleValue());
                        totalAmount = totalAmount.add(item.getTotalPrice());
                    }
                    priceCell.setCellStyle(moneyStyle);
                    amountCell.setCellStyle(moneyStyle);

                    Cell remarkCell = row.createCell(5);
                    remarkCell.setCellValue(item.getRemark() == null ? "" : item.getRemark());
                    remarkCell.setCellStyle(dataStyle);
                }
            }

            // 空一行
            Row emptyRow = sheet.createRow(rowIdx++);
            emptyRow.setHeightInPoints(28.35f);

            // 总计
            Row totalRow = sheet.createRow(rowIdx++);
            totalRow.setHeightInPoints(28.35f);
            Cell totalLabelCell = totalRow.createCell(1);
            totalLabelCell.setCellValue("总计");
            totalLabelCell.setCellStyle(totalStyle);

            Cell totalAmountCell = totalRow.createCell(4);
            totalAmountCell.setCellValue(totalAmount.doubleValue());
            totalAmountCell.setCellStyle(createExcelMoneyStyle(wb, totalStyle));

            wb.write(out);
        }
    }

    /**
     * 导出 PDF
     */
    public static void exportPdf(List<RevenueRecordVO> records, String projectName,
                                 LocalDate startDate, LocalDate endDate, OutputStream out) throws IOException {
        List<RevenueRecordVO> sorted = sortByDate(records);
        String title = buildTitle(startDate, endDate, projectName);

        Document document = new Document(PageSize.A4, 72, 72, 72, 72);
        PdfWriter.getInstance(document, out);
        document.open();

        PdfPTable currentTable = createPdfTable(title);
        int currentPageRows = 0;
        BigDecimal pageAmount = BigDecimal.ZERO;
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (RevenueRecordVO record : sorted) {
            int recordRows = record.getItems() == null ? 0 : record.getItems().size();
            if (recordRows == 0) continue;

            // 如果当前页放不下这条记录，则结束本页并新建一页
            if (currentPageRows > 0 && currentPageRows + recordRows > WORD_ROWS_PER_PAGE) {
                addPdfPageTotalRow(currentTable, pageAmount);
                document.add(currentTable);
                document.newPage();
                currentTable = createPdfTable(title);
                currentPageRows = 0;
                pageAmount = BigDecimal.ZERO;
            }

            List<RevenueRecordVO.RevenueRecordItemVO> items = record.getItems();
            for (int i = 0; i < items.size(); i++) {
                RevenueRecordVO.RevenueRecordItemVO item = items.get(i);

                // 日期：仅该记录第1行显示，使用 rowspan
                if (i == 0) {
                    PdfPCell dateCell = new PdfPCell(new Phrase(formatDate(record.getRecordDate()), PdfFontUtil.getNormalFont()));
                    dateCell.setRowspan(recordRows);
                    dateCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                    dateCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
                    dateCell.setMinimumHeight(28.35f * recordRows);
                    dateCell.setBorder(Rectangle.BOX);
                    currentTable.addCell(dateCell);
                }

                String typeText = item.getWorkerTypeText() == null ? "" : item.getWorkerTypeText();
                String serviceName = (item.getServiceName() == null ? "" : item.getServiceName()) + "    " + typeText;
                currentTable.addCell(createPdfDataCell(serviceName, false));
                currentTable.addCell(createPdfDataCell(item.getQuantity() == null ? "" : String.valueOf(item.getQuantity()), false));
                currentTable.addCell(createPdfDataCell(item.getUnitPrice() == null ? "" : formatAmount(item.getUnitPrice()), false));
                currentTable.addCell(createPdfDataCell(item.getTotalPrice() == null ? "" : formatAmount(item.getTotalPrice()), false));
                currentTable.addCell(createPdfDataCell(item.getRemark() == null ? "" : item.getRemark(), false));

                currentPageRows++;
                pageAmount = pageAmount.add(item.getTotalPrice() == null ? BigDecimal.ZERO : item.getTotalPrice());
                totalAmount = totalAmount.add(item.getTotalPrice() == null ? BigDecimal.ZERO : item.getTotalPrice());
            }
        }

        // 最后一页：页计、空行、总计
        addPdfPageTotalRow(currentTable, pageAmount);
        addPdfEmptyRow(currentTable);
        addPdfTotalRow(currentTable, totalAmount);

        document.add(currentTable);
        document.add(new Paragraph(" ", PdfFontUtil.getNormalFont()));
        document.close();
    }

    private static PdfPTable createPdfTable(String title) {
        PdfPTable table = new PdfPTable(HEADERS.length);
        table.setWidthPercentage(100);
        try {
            table.setWidths(new float[]{0.14f, 0.30f, 0.10f, 0.12f, 0.12f, 0.22f});
        } catch (Exception ignored) {
        }

        // 标题行
        PdfPCell titleCell = new PdfPCell(new Phrase(title, PdfFontUtil.getTitleFont()));
        titleCell.setColspan(HEADERS.length);
        titleCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        titleCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        titleCell.setMinimumHeight(28.35f);
        titleCell.setBorder(Rectangle.BOX);
        table.addCell(titleCell);

        // 表头行
        for (String header : HEADERS) {
            PdfPCell cell = new PdfPCell(new Phrase(header, PdfFontUtil.getBoldFont()));
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            cell.setMinimumHeight(28.35f);
            cell.setBorder(Rectangle.BOX);
            cell.setBackgroundColor(new Color(240, 240, 240));
            table.addCell(cell);
        }
        return table;
    }

    private static PdfPCell createPdfDataCell(String text, boolean bold) {
        PdfPCell cell = new PdfPCell(new Phrase(text == null ? "" : text,
                bold ? PdfFontUtil.getBoldFont() : PdfFontUtil.getNormalFont()));
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setMinimumHeight(28.35f);
        cell.setBorder(Rectangle.BOX);
        cell.setPadding(4);
        return cell;
    }

    private static void addPdfPageTotalRow(PdfPTable table, BigDecimal pageAmount) {
        table.addCell(createPdfDataCell("", false));
        PdfPCell labelCell = new PdfPCell(new Phrase("页计", PdfFontUtil.getBoldFont()));
        labelCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        labelCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        labelCell.setMinimumHeight(28.35f);
        labelCell.setBorder(Rectangle.BOX);
        table.addCell(labelCell);
        table.addCell(createPdfDataCell("", false));
        table.addCell(createPdfDataCell("", false));
        PdfPCell amountCell = new PdfPCell(new Phrase(formatAmount(pageAmount), PdfFontUtil.getBoldFont()));
        amountCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        amountCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        amountCell.setMinimumHeight(28.35f);
        amountCell.setBorder(Rectangle.BOX);
        table.addCell(amountCell);
        table.addCell(createPdfDataCell("", false));
    }

    private static void addPdfTotalRow(PdfPTable table, BigDecimal totalAmount) {
        table.addCell(createPdfDataCell("", false));
        PdfPCell labelCell = new PdfPCell(new Phrase("总计", PdfFontUtil.getTitleFont()));
        labelCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        labelCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        labelCell.setMinimumHeight(28.35f);
        labelCell.setBorder(Rectangle.BOX);
        table.addCell(labelCell);
        PdfPCell emptyCell = new PdfPCell(new Phrase("", PdfFontUtil.getNormalFont()));
        emptyCell.setColspan(2);
        emptyCell.setBorder(Rectangle.BOX);
        table.addCell(emptyCell);
        PdfPCell amountCell = new PdfPCell(new Phrase(formatAmount(totalAmount), PdfFontUtil.getTitleFont()));
        amountCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        amountCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        amountCell.setMinimumHeight(28.35f);
        amountCell.setBorder(Rectangle.BOX);
        table.addCell(amountCell);
        table.addCell(createPdfDataCell("", false));
    }

    private static void addPdfEmptyRow(PdfPTable table) {
        for (int i = 0; i < HEADERS.length; i++) {
            table.addCell(createPdfDataCell("", false));
        }
    }

    // ==================== Word 辅助方法 ====================

    private static XWPFTable createWordTable(XWPFDocument doc, String title) {
        XWPFTable table = doc.createTable(2, HEADERS.length);
        setTableWidth(table);

        // 标题行：合并所有单元格
        XWPFTableRow titleRow = table.getRow(0);
        setRowHeight(titleRow);
        for (int i = 0; i < HEADERS.length; i++) {
            XWPFTableCell cell = titleRow.getCell(i);
            CTTcPr tcPr = cell.getCTTc().isSetTcPr() ? cell.getCTTc().getTcPr() : cell.getCTTc().addNewTcPr();
            if (i == 0) {
                // 第一个单元格：设置 gridSpan 覆盖所有列，并标记合并起点
                CTDecimalNumber gridSpan = tcPr.isSetGridSpan() ? tcPr.getGridSpan() : tcPr.addNewGridSpan();
                gridSpan.setVal(BigInteger.valueOf(HEADERS.length));
                CTHMerge hMerge = tcPr.isSetHMerge() ? tcPr.getHMerge() : tcPr.addNewHMerge();
                hMerge.setVal(STMerge.RESTART);
                setCellWidth(cell, WORD_TABLE_WIDTH);
                setCellText(cell, title, true, 14, "黑体");
            } else {
                // 其余单元格：标记为合并延续，清空段落避免显示空边框
                CTHMerge hMerge = tcPr.isSetHMerge() ? tcPr.getHMerge() : tcPr.addNewHMerge();
                hMerge.setVal(STMerge.CONTINUE);
                cell.removeParagraph(0);
            }
        }

        // 表头行：黑体、字号稍大、加粗
        XWPFTableRow headerRow = table.getRow(1);
        setRowHeight(headerRow);
        for (int i = 0; i < HEADERS.length; i++) {
            XWPFTableCell cell = headerRow.getCell(i);
            setCellWidth(cell, WORD_COL_WIDTHS[i]);
            setCellText(cell, HEADERS[i], true, 12, "黑体");
        }
        return table;
    }

    private static void addPageTotalRow(XWPFTable table, BigDecimal pageAmount) {
        XWPFTableRow row = table.createRow();
        setRowHeight(row);
        setCellText(row.getCell(0), "");
        setCellText(row.getCell(1), "页计", true, 10, "宋体");
        setCellText(row.getCell(2), "");
        setCellText(row.getCell(3), "");
        setCellText(row.getCell(4), formatAmount(pageAmount), true, 10, "宋体");
        setCellText(row.getCell(5), "");
    }

    private static void addTotalRow(XWPFTable table, BigDecimal totalAmount) {
        XWPFTableRow row = table.createRow();
        setRowHeight(row);
        setCellText(row.getCell(0), "");
        setCellText(row.getCell(1), "总计", true, 11, "宋体");
        setCellText(row.getCell(2), "");
        setCellText(row.getCell(3), "");
        setCellText(row.getCell(4), formatAmount(totalAmount), true, 11, "宋体");
        setCellText(row.getCell(5), "");
    }

    private static void addEmptyRow(XWPFTable table) {
        XWPFTableRow row = table.createRow();
        setRowHeight(row);
        for (int i = 0; i < HEADERS.length; i++) {
            setCellText(row.getCell(i), "");
        }
    }

    private static void addPageBreak(XWPFDocument doc) {
        XWPFParagraph paragraph = doc.createParagraph();
        XWPFRun run = paragraph.createRun();
        run.addBreak(BreakType.PAGE);
    }

    private static void setTableWidth(XWPFTable table) {
        CTTblWidth tblWidth = table.getCTTbl().getTblPr() != null
                ? table.getCTTbl().getTblPr().getTblW()
                : table.getCTTbl().addNewTblPr().addNewTblW();
        tblWidth.setType(STTblWidth.DXA);
        tblWidth.setW(BigInteger.valueOf(WORD_TABLE_WIDTH));
    }

    private static void setCellWidth(XWPFTableCell cell, int widthDxa) {
        CTTcPr tcPr = cell.getCTTc().isSetTcPr() ? cell.getCTTc().getTcPr() : cell.getCTTc().addNewTcPr();
        CTTblWidth tcW = tcPr.isSetTcW() ? tcPr.getTcW() : tcPr.addNewTcW();
        tcW.setType(STTblWidth.DXA);
        tcW.setW(BigInteger.valueOf(widthDxa));
    }

    private static void setRowHeight(XWPFTableRow row) {
        row.setHeight(ROW_HEIGHT_TWIPS);
    }

    private static void setCellText(XWPFTableCell cell, String text) {
        setCellText(cell, text, false, 10, "宋体");
    }

    private static void setCellText(XWPFTableCell cell, String text, boolean bold, int fontSize, String fontFamily) {
        XWPFParagraph p;
        if (cell.getParagraphs().isEmpty()) {
            p = cell.addParagraph();
        } else {
            p = cell.getParagraphs().get(0);
            for (int i = p.getRuns().size() - 1; i >= 0; i--) {
                p.removeRun(i);
            }
        }
        p.setAlignment(ParagraphAlignment.CENTER);
        XWPFRun run = p.createRun();
        run.setText(text == null ? "" : text);
        run.setFontSize(fontSize);
        run.setFontFamily(fontFamily);
        run.setBold(bold);

        // 垂直居中
        CTTcPr tcPr = cell.getCTTc().isSetTcPr() ? cell.getCTTc().getTcPr() : cell.getCTTc().addNewTcPr();
        CTVerticalJc vAlign = tcPr.isSetVAlign() ? tcPr.getVAlign() : tcPr.addNewVAlign();
        vAlign.setVal(STVerticalJc.CENTER);
    }

    private static void setPageMargins(XWPFDocument doc) {
        CTSectPr sectPr = doc.getDocument().getBody().isSetSectPr()
                ? doc.getDocument().getBody().getSectPr()
                : doc.getDocument().getBody().addNewSectPr();
        CTPageMar pageMar = sectPr.isSetPgMar() ? sectPr.getPgMar() : sectPr.addNewPgMar();
        // 上下 2.5cm，左右 2cm（1cm ≈ 567 twips）
        pageMar.setTop(BigInteger.valueOf(1417));
        pageMar.setBottom(BigInteger.valueOf(1417));
        pageMar.setLeft(BigInteger.valueOf(1134));
        pageMar.setRight(BigInteger.valueOf(1134));
    }

    private static String buildTitle(LocalDate startDate, LocalDate endDate, String projectName) {
        String start = startDate == null ? "" : startDate.format(DateTimeFormatter.ofPattern("yyyy.MM.dd"));
        String end = endDate == null ? "" : endDate.format(DateTimeFormatter.ofPattern("yyyy.MM.dd"));
        return start + "~" + end + " - " + (projectName == null ? "" : projectName) + " - 绿化用工";
    }

    // ==================== Excel 辅助方法 ====================

    private static CellStyle createExcelTitleStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        Font font = wb.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 14);
        style.setFont(font);
        return style;
    }

    private static CellStyle createExcelHeaderStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        Font font = wb.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 11);
        style.setFont(font);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    private static CellStyle createExcelDataStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    private static CellStyle createExcelTotalStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        Font font = wb.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 12);
        style.setFont(font);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    private static CellStyle createExcelMoneyStyle(Workbook wb, CellStyle baseStyle) {
        CellStyle style = wb.createCellStyle();
        style.cloneStyleFrom(baseStyle);
        style.setDataFormat(wb.createDataFormat().getFormat("0.00"));
        return style;
    }



    // ==================== 通用辅助方法 ====================

    private static List<RevenueRecordVO> sortByDate(List<RevenueRecordVO> records) {
        records.sort(Comparator.comparing(RevenueRecordVO::getRecordDate, Comparator.nullsLast(Comparator.naturalOrder())));
        return records;
    }

    private static String formatDate(LocalDate date) {
        return date == null ? "" : date.format(DATE_FMT);
    }

    private static String formatAmount(BigDecimal amount) {
        return amount == null ? "" : amount.setScale(2, java.math.RoundingMode.HALF_UP).toPlainString();
    }
}
