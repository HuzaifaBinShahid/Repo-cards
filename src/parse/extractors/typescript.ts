import type Parser from 'web-tree-sitter';
import type { CkSymbol, FileNode, ImportEdge, SymbolKind, DiscoveredFile } from '../../types';
import { getParser } from '../parser';

export async function extractTypescript(
  file: DiscoveredFile,
  source: string,
  hash: string,
): Promise<FileNode> {
  if (file.lang === 'md') throw new Error('extractTypescript does not handle markdown');
  const parser = await getParser(file.lang);
  const tree = parser.parse(source);

  const symbols: CkSymbol[] = [];
  const imports: ImportEdge[] = [];

  walk(tree.rootNode, (node) => {
    switch (node.type) {
      case 'function_declaration':
      case 'generator_function_declaration': {
        const name = node.childForFieldName('name')?.text;
        if (name) symbols.push(mkSymbol(file.path, 'function', name, node, isExportedStmt(node)));
        return true;
      }
      case 'class_declaration':
      case 'abstract_class_declaration': {
        const name = node.childForFieldName('name')?.text;
        if (name) symbols.push(mkSymbol(file.path, 'class', name, node, isExportedStmt(node)));
        return true;
      }
      case 'interface_declaration': {
        const name = node.childForFieldName('name')?.text;
        if (name) symbols.push(mkSymbol(file.path, 'interface', name, node, isExportedStmt(node)));
        return true;
      }
      case 'type_alias_declaration': {
        const name = node.childForFieldName('name')?.text;
        if (name) symbols.push(mkSymbol(file.path, 'type', name, node, isExportedStmt(node)));
        return true;
      }
      case 'enum_declaration': {
        const name = node.childForFieldName('name')?.text;
        if (name) symbols.push(mkSymbol(file.path, 'enum', name, node, isExportedStmt(node)));
        return true;
      }
      case 'method_definition': {
        const nameNode = node.childForFieldName('name');
        const name = nameNode?.text;
        if (name && !name.startsWith('#')) {
          symbols.push(mkSymbol(file.path, 'method', name, node, false));
        }
        return true;
      }
      case 'lexical_declaration':
      case 'variable_declaration': {
        if (!isTopLevelDecl(node)) return true;
        const exported = isExportedStmt(node);
        for (const declarator of node.namedChildren) {
          if (declarator.type !== 'variable_declarator') continue;
          const nameNode = declarator.childForFieldName('name');
          if (nameNode && nameNode.type === 'identifier') {
            symbols.push(mkSymbol(file.path, 'const', nameNode.text, nameNode, exported));
          }
        }
        return true;
      }
      case 'import_statement': {
        imports.push(parseImport(node, file.path));
        return true;
      }
      default:
        return true;
    }
  });

  tree.delete();

  return {
    path: file.path,
    lang: file.lang,
    loc: source.split('\n').length,
    hash,
    symbols,
    imports,
  };
}

function walk(node: Parser.SyntaxNode, visit: (n: Parser.SyntaxNode) => boolean): void {
  const cont = visit(node);
  if (!cont) return;
  for (const child of node.namedChildren) walk(child, visit);
}

function mkSymbol(
  file: string,
  kind: SymbolKind,
  name: string,
  node: Parser.SyntaxNode,
  exported: boolean,
): CkSymbol {
  return {
    id: `${file}#${kind}:${name}:${node.startPosition.row + 1}`,
    name,
    kind,
    file,
    line: node.startPosition.row + 1,
    col: node.startPosition.column + 1,
    exported,
  };
}

function isExportedStmt(node: Parser.SyntaxNode): boolean {
  return node.parent?.type === 'export_statement';
}

function isTopLevelDecl(node: Parser.SyntaxNode): boolean {
  const parent = node.parent;
  if (!parent) return true;
  if (parent.type === 'program') return true;
  if (parent.type === 'export_statement' && parent.parent?.type === 'program') return true;
  return false;
}

function parseImport(node: Parser.SyntaxNode, fromFile: string): ImportEdge {
  const sourceNode =
    node.childForFieldName('source') ??
    node.namedChildren.find((n) => n.type === 'string');
  const sourceText = sourceNode?.text.replace(/^['"]|['"]$/g, '') ?? '';
  const names: string[] = [];
  const clause = node.namedChildren.find((n) => n.type === 'import_clause');
  if (clause) {
    for (const child of clause.namedChildren) {
      if (child.type === 'identifier') {
        names.push(child.text);
      } else if (child.type === 'namespace_import') {
        names.push('*');
      } else if (child.type === 'named_imports') {
        for (const spec of child.namedChildren) {
          if (spec.type === 'import_specifier') {
            const n = spec.childForFieldName('name') ?? spec.namedChildren[0];
            if (n) names.push(n.text);
          }
        }
      }
    }
  }
  return {
    from: fromFile,
    source: sourceText,
    names,
    line: node.startPosition.row + 1,
  };
}
