from pathlib import Path

from docx import Document


PATH = Path("output/doc/win_内容表述优化版.docx")


def main():
    doc = Document(str(PATH))
    changed = 0
    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                if cell.text == "验证关键词匹配+语义召回，以及详情页返回后的状态保活体验。":
                    cell.text = "验证关键词匹配与语义召回，以及详情页返回后的状态保活体验。"
                    changed += 1
    doc.save(str(PATH))
    print(f"saved: {PATH}")
    print(f"changed cells: {changed}")


if __name__ == "__main__":
    main()
