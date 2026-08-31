package com.green.module.ledger.util;

import com.green.common.util.PdfFontUtil;
import com.green.module.ledger.vo.LedgerVO;
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
import org.openxmlformats.schemas.wordprocessingml.x2006.main.STTblWidth;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.CTVerticalJc;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.STVerticalJc;

import java.awt.Color;
import java.io.IOException;
import java.io.OutputStream;
import java.math.BigDecimal;
import java.math.BigInteger;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;

/**
 * 台账导出工具类（Word/Excel）
 */
public class LedgerExportUtil {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("M月d日");
    private static final String[] HEADERS = {"日期", "营业内容", "营业额", "备注"};

    private static final int ROW_HEIGHT_TWIPS = 567;
    private static final int WORD_TABLE_WIDTH = 9638;
    private static final int[] WORD_COL_WIDTHS = {1495, 3450, 2500, 2193};

    public static void exportWord(List<LedgerVO> records, LocalDate startDate,
                                  LocalDate endDate, OutputStream out) throws IOException {
        List<LedgerVO> sorted = sortByDate(records);
        String title = buildTitle(startDate, endDate);
        try (XWPFDocument doc = new XWPFDocument()) {
            setPageMargins(doc);
            XWPFTable table = createWordTable(doc, title);
            BigDecimal totalAmount = BigDecimal.ZERO;

            for (LedgerVO record : sorted) {
                if (record.getItems() == null || record.getItems().isEmpty()) {
                    continue;
                }
                XWPFTableRow row = table.createRow();
                setRowHeight(row);
                setCellText(row.getCell(0), formatDate(record.getRecordDate()));
                setCellText(row.getCell(1), buildContent(record), false, 10, "宋体");
                setCellText(row.getCell(2), buildTurnover(record), false, 10, "宋体");
                setCellText(row.getCell(3), buildRemark(record), false, 10, "宋体");
                totalAmount = totalAmount.add(record.getTotalAmount() == null ? BigDecimal.ZERO : record.getTotalAmount());
            }

            addTotalRow(table, totalAmount);
            doc.write(out);
        }
    }

    public static void exportExcel(List<LedgerVO> records, LocalDate startDate,
                                   LocalDate endDate, OutputStream out) throws IOException {
        List<LedgerVO> sorted = sortByDate(records);
        String title = buildTitle(startDate, endDate);
        try (Workbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("台账导出");
            sheet.setColumnWidth(0, 14 * 256);
            sheet.setColumnWidth(1, 48 * 256);
            sheet.setColumnWidth(2, 32 * 256);
            sheet.setColumnWidth(3, 36 * 256);

            CellStyle titleStyle = createExcelTitleStyle(wb);
            CellStyle headerStyle = createExcelHeaderStyle(wb);
            CellStyle dataStyle = createExcelDataStyle(wb);
            CellStyle totalStyle = createExcelTotalStyle(wb);
            CellStyle moneyStyle = createExcelMoneyStyle(wb, false);

            Row titleRow = sheet.createRow(0);
            titleRow.setHeightInPoints(28.35f);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue(title);
            titleCell.setCellStyle(titleStyle);
            sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(0, 0, 0, HEADERS.length - 1));

            Row headerRow = sheet.createRow(1);
            headerRow.setHeightInPoints(28.35f);
            for (int i = 0; i < HEADERS.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(HEADERS[i]);
                cell.setCellStyle(headerStyle);
            }

            BigDecimal totalAmount = BigDecimal.ZERO;
            int rowIdx = 2;
            for (LedgerVO record : sorted) {
                if (record.getItems() == null || record.getItems().isEmpty()) {
                    continue;
                }
                Row row = sheet.createRow(rowIdx++);
                row.setHeightInPoints(28.35f);

                Cell dateCell = row.createCell(0);
                dateCell.setCellValue(formatDate(record.getRecordDate()));
                dateCell.setCellStyle(dataStyle);

                Cell contentCell = row.createCell(1);
                contentCell.setCellValue(buildContent(record));
                contentCell.setCellStyle(dataStyle);

                Cell turnoverCell = row.createCell(2);
                turnoverCell.setCellValue(buildTurnover(record));
                turnoverCell.setCellStyle(moneyStyle);

                Cell remarkCell = row.createCell(3);
                remarkCell.setCellValue(buildRemark(record));
                remarkCell.setCellStyle(dataStyle);

                totalAmount = totalAmount.add(record.getTotalAmount() == null ? BigDecimal.ZERO : record.getTotalAmount());
            }

            Row emptyRow = sheet.createRow(rowIdx++);
            emptyRow.setHeightInPoints(28.35f);

            Row totalRow = sheet.createRow(rowIdx++);
            totalRow.setHeightInPoints(28.35f);
            Cell totalLabelCell = totalRow.createCell(1);
            totalLabelCell.setCellValue("合计");
            totalLabelCell.setCellStyle(totalStyle);

            Cell totalAmountCell = totalRow.createCell(2);
            totalAmountCell.setCellValue(totalAmount.doubleValue());
            totalAmountCell.setCellStyle(createExcelMoneyStyle(wb, true));

            wb.write(out);
        }
    }

    /**
     * 导出 PDF
     */
    public static void exportPdf(List<LedgerVO> records, LocalDate startDate,
                                 LocalDate endDate, OutputStream out) throws IOException {
        List<LedgerVO> sorted = sortByDate(records);
        String title = buildTitle(startDate, endDate);

        Document document = new Document(PageSize.A4, 72, 72, 72, 72);
        PdfWriter.getInstance(document, out);
        document.open();

        PdfPTable table = new PdfPTable(4);
        table.setWidthPercentage(100);
        try {
            table.setWidths(new float[]{0.15f, 0.40f, 0.25f, 0.20f});
        } catch (Exception ignored) {
        }
        table.getDefaultCell().setHorizontalAlignment(Element.ALIGN_CENTER);
        table.getDefaultCell().setVerticalAlignment(Element.ALIGN_MIDDLE);

        // 标题行
        PdfPCell titleCell = new PdfPCell(new Phrase(title, PdfFontUtil.getTitleFont()));
        titleCell.setColspan(4);
        titleCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        titleCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        titleCell.setMinimumHeight(28.35f);
        titleCell.setBorder(Rectangle.BOX);
        table.addCell(titleCell);

        // 表头
        for (String header : HEADERS) {
            PdfPCell cell = new PdfPCell(new Phrase(header, PdfFontUtil.getBoldFont()));
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            cell.setMinimumHeight(28.35f);
            cell.setBorder(Rectangle.BOX);
            cell.setBackgroundColor(new Color(240, 240, 240));
            table.addCell(cell);
        }

        BigDecimal totalAmount = BigDecimal.ZERO;
        for (LedgerVO record : sorted) {
            if (record.getItems() == null || record.getItems().isEmpty()) {
                continue;
            }
            table.addCell(createDataCell(formatDate(record.getRecordDate()), false));
            table.addCell(createDataCell(buildContent(record), false));
            table.addCell(createDataCell(buildTurnover(record), false));
            table.addCell(createDataCell(buildRemark(record), false));
            totalAmount = totalAmount.add(record.getTotalAmount() == null ? BigDecimal.ZERO : record.getTotalAmount());
        }

        // 合计行
        table.addCell(createDataCell("", false));
        PdfPCell totalLabelCell = new PdfPCell(new Phrase("合计", PdfFontUtil.getBoldFont()));
        totalLabelCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        totalLabelCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        totalLabelCell.setMinimumHeight(28.35f);
        totalLabelCell.setBorder(Rectangle.BOX);
        table.addCell(totalLabelCell);
        PdfPCell totalAmountCell = new PdfPCell(new Phrase(formatAmount(totalAmount), PdfFontUtil.getBoldFont()));
        totalAmountCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        totalAmountCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        totalAmountCell.setMinimumHeight(28.35f);
        totalAmountCell.setBorder(Rectangle.BOX);
        table.addCell(totalAmountCell);
        table.addCell(createDataCell("", false));

        document.add(table);
        document.add(new Paragraph(" ", PdfFontUtil.getNormalFont()));
        document.close();
    }

    private static PdfPCell createDataCell(String text, boolean bold) {
        PdfPCell cell = new PdfPCell(new Phrase(text == null ? "" : text,
                bold ? PdfFontUtil.getBoldFont() : PdfFontUtil.getNormalFont()));
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setMinimumHeight(28.35f);
        cell.setBorder(Rectangle.BOX);
        cell.setPadding(4);
        return cell;
    }

    private static String buildContent(LedgerVO record) {
        List<LedgerVO.LedgerItemVO> items = record.getItems();
        if (items == null || items.isEmpty()) {
            return "";
        }
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < items.size(); i++) {
            LedgerVO.LedgerItemVO item = items.get(i);
            if (i > 0) {
                sb.append("+");
            }
            sb.append(item.getServiceName() == null ? "" : item.getServiceName());
            String typeText = item.getWorkerTypeText() == null ? "" : item.getWorkerTypeText();
            if (!typeText.isEmpty()) {
                sb.append("·").append(typeText);
            }
            sb.append("·").append(item.getQuantity() == null ? 0 : item.getQuantity()).append("人");
        }
        return sb.toString();
    }

    private static String buildTurnover(LedgerVO record) {
        List<LedgerVO.LedgerItemVO> items = record.getItems();
        if (items == null || items.isEmpty()) {
            return "";
        }
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < items.size(); i++) {
            LedgerVO.LedgerItemVO item = items.get(i);
            if (i > 0) {
                sb.append("+");
            }
            int qty = item.getQuantity() == null ? 0 : item.getQuantity();
            sb.append(qty).append("×").append(formatUnitPrice(item.getUnitPrice()));
        }
        sb.append("=").append(formatAmount(record.getTotalAmount()));
        return sb.toString();
    }

    private static String buildRemark(LedgerVO record) {
        List<LedgerVO.LedgerItemVO> items = record.getItems();
        if (items == null || items.isEmpty()) {
            return (record.getProjectName() == null ? "" : record.getProjectName()) + "等";
        }
        String projectName = record.getProjectName() == null ? "" : record.getProjectName();
        String firstRemark = items.get(0).getRemark() == null ? "" : items.get(0).getRemark();
        if (firstRemark.isEmpty()) {
            return projectName + "等";
        }
        return projectName + "·" + firstRemark + "等";
    }

    private static String formatDate(LocalDate date) {
        return date == null ? "" : date.format(DATE_FMT);
    }

    private static String formatAmount(BigDecimal value) {
        if (value == null) {
            return "0.00";
        }
        return value.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    private static String formatUnitPrice(BigDecimal value) {
        if (value == null) {
            return "0";
        }
        return value.stripTrailingZeros().toPlainString();
    }

    private static List<LedgerVO> sortByDate(List<LedgerVO> records) {
        return records.stream()
                .sorted(Comparator.comparing(LedgerVO::getRecordDate,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();
    }

    private static String buildTitle(LocalDate startDate, LocalDate endDate) {
        String start = startDate == null ? "" : startDate.format(DateTimeFormatter.ofPattern("yyyy.MM.dd"));
        String end = endDate == null ? "" : endDate.format(DateTimeFormatter.ofPattern("yyyy.MM.dd"));
        return start + "~" + end + " - 台账导出";
    }

    // ==================== Word helpers ====================

    private static XWPFTable createWordTable(XWPFDocument doc, String title) {
        XWPFTable table = doc.createTable(2, HEADERS.length);
        setTableWidth(table);

        XWPFTableRow titleRow = table.getRow(0);
        setRowHeight(titleRow);
        for (int i = 0; i < HEADERS.length; i++) {
            XWPFTableCell cell = titleRow.getCell(i);
            CTTcPr tcPr = cell.getCTTc().isSetTcPr() ? cell.getCTTc().getTcPr() : cell.getCTTc().addNewTcPr();
            if (i == 0) {
                CTDecimalNumber gridSpan = tcPr.isSetGridSpan() ? tcPr.getGridSpan() : tcPr.addNewGridSpan();
                gridSpan.setVal(BigInteger.valueOf(HEADERS.length));
                CTHMerge hMerge = tcPr.isSetHMerge() ? tcPr.getHMerge() : tcPr.addNewHMerge();
                hMerge.setVal(STMerge.RESTART);
                setCellWidth(cell, WORD_TABLE_WIDTH);
                setCellText(cell, title, true, 14, "黑体");
            } else {
                CTHMerge hMerge = tcPr.isSetHMerge() ? tcPr.getHMerge() : tcPr.addNewHMerge();
                hMerge.setVal(STMerge.CONTINUE);
                cell.removeParagraph(0);
            }
        }

        XWPFTableRow headerRow = table.getRow(1);
        setRowHeight(headerRow);
        for (int i = 0; i < HEADERS.length; i++) {
            XWPFTableCell cell = headerRow.getCell(i);
            setCellWidth(cell, WORD_COL_WIDTHS[i]);
            setCellText(cell, HEADERS[i], true, 12, "黑体");
        }
        return table;
    }

    private static void addTotalRow(XWPFTable table, BigDecimal totalAmount) {
        XWPFTableRow row = table.createRow();
        setRowHeight(row);
        setCellText(row.getCell(0), "");
        setCellText(row.getCell(1), "合计", true, 11, "宋体");
        setCellText(row.getCell(2), formatAmount(totalAmount), true, 11, "宋体");
        setCellText(row.getCell(3), "");
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

        CTTcPr tcPr = cell.getCTTc().isSetTcPr() ? cell.getCTTc().getTcPr() : cell.getCTTc().addNewTcPr();
        CTVerticalJc vAlign = tcPr.isSetVAlign() ? tcPr.getVAlign() : tcPr.addNewVAlign();
        vAlign.setVal(STVerticalJc.CENTER);
    }

    private static void setPageMargins(XWPFDocument doc) {
        CTSectPr sectPr = doc.getDocument().getBody().isSetSectPr()
                ? doc.getDocument().getBody().getSectPr()
                : doc.getDocument().getBody().addNewSectPr();
        CTPageMar pageMar = sectPr.isSetPgMar() ? sectPr.getPgMar() : sectPr.addNewPgMar();
        pageMar.setTop(BigInteger.valueOf(1417));
        pageMar.setBottom(BigInteger.valueOf(1417));
        pageMar.setLeft(BigInteger.valueOf(1134));
        pageMar.setRight(BigInteger.valueOf(1134));
    }

    // ==================== Excel helpers ====================

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
        style.setWrapText(true);
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

    private static CellStyle createExcelMoneyStyle(Workbook wb, boolean bold) {
        CellStyle style = wb.createCellStyle();
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setWrapText(true);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        Font font = wb.createFont();
        font.setBold(bold);
        font.setFontHeightInPoints((short) (bold ? 12 : 10));
        style.setFont(font);
        return style;
    }
}
