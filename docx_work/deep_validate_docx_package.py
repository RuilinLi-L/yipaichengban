from __future__ import annotations

from pathlib import Path
from posixpath import normpath
from zipfile import ZipFile

from lxml import etree


ROOT = Path(__file__).resolve().parents[1]
DOCX = ROOT / "output" / "doc" / "win_应用赛道初赛作品策划.docx"

REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"
OFFICE_REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"


def resolve_target(rels_part: str, target: str) -> str:
    if target.startswith("/"):
        return normpath(target.lstrip("/"))
    base = Path(rels_part)
    if base.name == ".rels":
        source_dir = base.parent.parent
    else:
        source_dir = base.parent.parent
    return normpath(str((source_dir / target).as_posix()))


def main() -> None:
    with ZipFile(DOCX) as zf:
        names = set(zf.namelist())
        for xml_name in [n for n in names if n.endswith(".xml")]:
            etree.fromstring(zf.read(xml_name))

        missing = []
        for rel_name in [n for n in names if n.endswith(".rels")]:
            root = etree.fromstring(zf.read(rel_name))
            for rel in root.findall(f"{{{REL_NS}}}Relationship"):
                target = rel.get("Target") or ""
                mode = rel.get("TargetMode")
                rel_type = rel.get("Type") or ""
                if mode == "External" or target.startswith(("http:", "https:", "mailto:")):
                    continue
                resolved = resolve_target(rel_name, target)
                if resolved not in names:
                    missing.append((rel_name, rel_type, target, resolved))

        with ZipFile(DOCX) as zf2:
            doc_xml = zf2.read("word/document.xml")
            root = etree.fromstring(doc_xml)
            drawings = root.xpath(".//*[local-name()='drawing']")
            text_nodes = root.xpath(".//*[local-name()='t']/text()")

        print(f"xml_parts_valid=YES")
        print(f"relationships_missing={len(missing)}")
        print(f"drawings={len(drawings)}")
        print(f"text_nodes={len(text_nodes)}")
        if missing:
            for rel_name, rel_type, target, resolved in missing:
                print(f"missing: {rel_name} {rel_type} {target} -> {resolved}")
            raise SystemExit("DOCX has missing relationship targets")
        if len(drawings) < 5:
            raise SystemExit("Expected at least 5 drawings")


if __name__ == "__main__":
    main()
