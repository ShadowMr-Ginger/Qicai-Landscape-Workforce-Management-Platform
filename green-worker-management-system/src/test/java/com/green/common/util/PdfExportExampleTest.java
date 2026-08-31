package com.green.common.util;

import com.green.module.ledger.util.LedgerExportUtil;
import com.green.module.ledger.vo.LedgerVO;
import com.green.module.project.util.RevenueRecordExportUtil;
import com.green.module.project.vo.RevenueRecordVO;
import org.junit.jupiter.api.Test;

import java.io.FileOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

class PdfExportExampleTest {

    @Test
    void generateLedgerPdfExample() throws Exception {
        List<LedgerVO> records = new ArrayList<>();

        LedgerVO r1 = new LedgerVO();
        r1.setId(1L);
        r1.setProjectId(1L);
        r1.setProjectName("示例项目A");
        r1.setRecordDate(LocalDate.of(2024, 8, 15));
        r1.setTotalAmount(new BigDecimal("1250.00"));
        LedgerVO.LedgerItemVO i1 = new LedgerVO.LedgerItemVO();
        i1.setServiceName("修剪草坪");
        i1.setWorkerTypeText("男工");
        i1.setQuantity(5);
        i1.setUnitPrice(new BigDecimal("150.00"));
        i1.setTotalPrice(new BigDecimal("750.00"));
        i1.setRemark(" front yard");
        LedgerVO.LedgerItemVO i2 = new LedgerVO.LedgerItemVO();
        i2.setServiceName("种花");
        i2.setWorkerTypeText("女工");
        i2.setQuantity(2);
        i2.setUnitPrice(new BigDecimal("250.00"));
        i2.setTotalPrice(new BigDecimal("500.00"));
        i2.setRemark("玫瑰");
        r1.setItems(Arrays.asList(i1, i2));
        records.add(r1);

        LedgerVO r2 = new LedgerVO();
        r2.setId(2L);
        r2.setProjectId(1L);
        r2.setProjectName("示例项目A");
        r2.setRecordDate(LocalDate.of(2024, 8, 16));
        r2.setTotalAmount(new BigDecimal("800.00"));
        LedgerVO.LedgerItemVO i3 = new LedgerVO.LedgerItemVO();
        i3.setServiceName("浇水");
        i3.setWorkerTypeText("男工");
        i3.setQuantity(4);
        i3.setUnitPrice(new BigDecimal("200.00"));
        i3.setTotalPrice(new BigDecimal("800.00"));
        i3.setRemark("全面");
        r2.setItems(Arrays.asList(i3));
        records.add(r2);

        try (FileOutputStream out = new FileOutputStream("target/ledger-example.pdf")) {
            LedgerExportUtil.exportPdf(records, LocalDate.of(2024, 8, 1), LocalDate.of(2024, 8, 31), out);
        }
        System.out.println("Generated: target/ledger-example.pdf");
    }

    @Test
    void generateRevenueRecordPdfExample() throws Exception {
        List<RevenueRecordVO> records = new ArrayList<>();

        RevenueRecordVO r1 = new RevenueRecordVO();
        r1.setId(1L);
        r1.setProjectId(1L);
        r1.setRecordDate(LocalDate.of(2024, 8, 15));
        r1.setTotalAmount(new BigDecimal("1250.00"));
        RevenueRecordVO.RevenueRecordItemVO i1 = new RevenueRecordVO.RevenueRecordItemVO();
        i1.setServiceName("修剪草坪");
        i1.setWorkerTypeText("男工");
        i1.setQuantity(5);
        i1.setUnitPrice(new BigDecimal("150.00"));
        i1.setTotalPrice(new BigDecimal("750.00"));
        i1.setRemark("前院");
        RevenueRecordVO.RevenueRecordItemVO i2 = new RevenueRecordVO.RevenueRecordItemVO();
        i2.setServiceName("种花");
        i2.setWorkerTypeText("女工");
        i2.setQuantity(2);
        i2.setUnitPrice(new BigDecimal("250.00"));
        i2.setTotalPrice(new BigDecimal("500.00"));
        i2.setRemark("玫瑰");
        r1.setItems(Arrays.asList(i1, i2));
        records.add(r1);

        RevenueRecordVO r2 = new RevenueRecordVO();
        r2.setId(2L);
        r2.setProjectId(1L);
        r2.setRecordDate(LocalDate.of(2024, 8, 16));
        r2.setTotalAmount(new BigDecimal("800.00"));
        RevenueRecordVO.RevenueRecordItemVO i3 = new RevenueRecordVO.RevenueRecordItemVO();
        i3.setServiceName("浇水");
        i3.setWorkerTypeText("男工");
        i3.setQuantity(4);
        i3.setUnitPrice(new BigDecimal("200.00"));
        i3.setTotalPrice(new BigDecimal("800.00"));
        i3.setRemark("全面");
        r2.setItems(Arrays.asList(i3));
        records.add(r2);

        try (FileOutputStream out = new FileOutputStream("target/revenue-example.pdf")) {
            RevenueRecordExportUtil.exportPdf(records, "示例项目A", LocalDate.of(2024, 8, 1), LocalDate.of(2024, 8, 31), out);
        }
        System.out.println("Generated: target/revenue-example.pdf");
    }
}
