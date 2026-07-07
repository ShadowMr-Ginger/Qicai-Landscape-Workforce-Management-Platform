package com.green.module.project.util;

import com.green.module.project.vo.RevenueRecordVO;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.xwpf.usermodel.*;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.CTTblWidth;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.CTTcPr;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.STTblWidth;

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

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy年M月d日");
    private static final String[] HEADERS = {"日期", "服务名称", "数量", "单价", "金额", "备注"};

    // Word 每页数据行数（表头、页计、总计另行计算）
    private static final int WORD_ROWS_PER_PAGE = 20;
    // 行高：1cm = 567 twips
    private static final int ROW_HEIGHT_TWIPS = 567;
    // 列宽（DXA）
    private static final int[] WORD_COL_WIDTHS = {1800, 3600, 1200, 1400, 1400, 2200};

    /**
     * 导出 Word
     */
    public static void exportWord(List<RevenueRecordVO> records, OutputStream out) throws IOException {
        List<RevenueRecordVO> sorted = sortByDate(records);
        try (XWPFDocument doc = new XWPFDocument()) {
            XWPFTable currentTable = createWordTable(doc);
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
                    currentTable = createWordTable(doc);
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
    public static void exportExcel(List<RevenueRecordVO> records, OutputStream out) throws IOException {
        List<RevenueRecordVO> sorted = sortByDate(records);
        try (Workbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("营业记录");
            // 设置列宽（单位：1/256 字符宽度）
            sheet.setColumnWidth(0, 14 * 256);
            sheet.setColumnWidth(1, 28 * 256);
            sheet.setColumnWidth(2, 10 * 256);
            sheet.setColumnWidth(3, 12 * 256);
            sheet.setColumnWidth(4, 12 * 256);
            sheet.setColumnWidth(5, 18 * 256);

            CellStyle headerStyle = createExcelHeaderStyle(wb);
            CellStyle dataStyle = createExcelDataStyle(wb);
            CellStyle totalStyle = createExcelTotalStyle(wb);
            CellStyle moneyStyle = createExcelMoneyStyle(wb, dataStyle);

            // 表头
            Row headerRow = sheet.createRow(0);
            headerRow.setHeightInPoints(28.35f); // 1cm
            for (int i = 0; i < HEADERS.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(HEADERS[i]);
                cell.setCellStyle(headerStyle);
            }

            BigDecimal totalAmount = BigDecimal.ZERO;
            int rowIdx = 1;

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
            totalAmountCell.setCellStyle(totalStyle);

            wb.write(out);
        }
    }

    // ==================== Word 辅助方法 ====================

    private static XWPFTable createWordTable(XWPFDocument doc) {
        XWPFTable table = doc.createTable(1, HEADERS.length);
        setTableWidth(table);

        // 设置表头
        XWPFTableRow headerRow = table.getRow(0);
        setRowHeight(headerRow);
        for (int i = 0; i < HEADERS.length; i++) {
            XWPFTableCell cell = headerRow.getCell(i);
            setCellWidth(cell, WORD_COL_WIDTHS[i]);
            setCellText(cell, HEADERS[i]);
            // 表头加粗居中
            for (XWPFParagraph p : cell.getParagraphs()) {
                p.setAlignment(ParagraphAlignment.CENTER);
                for (XWPFRun r : p.getRuns()) {
                    r.setBold(true);
                    r.setFontSize(10);
                }
            }
        }
        return table;
    }

    private static void addPageTotalRow(XWPFTable table, BigDecimal pageAmount) {
        XWPFTableRow row = table.createRow();
        setRowHeight(row);
        setCellText(row.getCell(0), "");
        setCellText(row.getCell(1), "页计");
        setCellText(row.getCell(2), "");
        setCellText(row.getCell(3), "");
        setCellText(row.getCell(4), formatAmount(pageAmount));
        setCellText(row.getCell(5), "");
        for (int i = 0; i < HEADERS.length; i++) {
            XWPFParagraph p = row.getCell(i).getParagraphs().get(0);
            p.setAlignment(i == 1 || i == 4 ? ParagraphAlignment.CENTER : ParagraphAlignment.LEFT);
            for (XWPFRun r : p.getRuns()) {
                r.setBold(true);
            }
        }
    }

    private static void addTotalRow(XWPFTable table, BigDecimal totalAmount) {
        XWPFTableRow row = table.createRow();
        setRowHeight(row);
        setCellText(row.getCell(0), "");
        setCellText(row.getCell(1), "总计");
        setCellText(row.getCell(2), "");
        setCellText(row.getCell(3), "");
        setCellText(row.getCell(4), formatAmount(totalAmount));
        setCellText(row.getCell(5), "");
        for (int i = 0; i < HEADERS.length; i++) {
            XWPFParagraph p = row.getCell(i).getParagraphs().get(0);
            p.setAlignment(i == 1 || i == 4 ? ParagraphAlignment.CENTER : ParagraphAlignment.LEFT);
            for (XWPFRun r : p.getRuns()) {
                r.setBold(true);
                r.setFontSize(11);
            }
        }
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
        tblWidth.setW(BigInteger.valueOf(11600)); // A4 可用宽度约 11600 dxa
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
        cell.removeParagraph(0);
        XWPFParagraph p = cell.addParagraph();
        p.setAlignment(ParagraphAlignment.CENTER);
        XWPFRun run = p.createRun();
        run.setText(text == null ? "" : text);
        run.setFontSize(10);
        run.setFontFamily("宋体");
    }

    // ==================== Excel 辅助方法 ====================

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
