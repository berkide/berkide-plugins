// Tree-sitter node type → syntax scope mapping
// Tree-sitter dugum tipi → soz dizimi kapsam eslesmesi
//
// This maps tree-sitter grammar node names to our scope names.
// Bu, tree-sitter gramer dugum adlarini kapsam adlarimiza esler.
// UI clients use these scopes to look up colors from the active theme.
// UI istemcileri, aktif temadan renkleri aramak icin bu kapsamlari kullanir.

export const scopeMap = {
    // Comments / Yorumlar
    "comment":                      "comment",
    "line_comment":                 "comment",
    "block_comment":                "comment",
    "doc_comment":                  "comment.doc",

    // Strings / Dizeler
    "string":                       "string",
    "string_literal":               "string",
    "template_string":              "string",
    "string_content":               "string",
    "escape_sequence":              "string.escape",
    "regex":                        "string.regex",
    "regex_pattern":                "string.regex",

    // Numbers / Sayilar
    "number":                       "number",
    "integer":                      "number",
    "float":                        "number",
    "number_literal":               "number",

    // Booleans and null / Mantiksal ve null
    "true":                         "boolean",
    "false":                        "boolean",
    "null":                         "null",
    "none":                         "null",
    "nil":                          "null",
    "undefined":                    "null",

    // Keywords / Anahtar kelimeler
    "if":                           "keyword.control",
    "else":                         "keyword.control",
    "for":                          "keyword.control",
    "while":                        "keyword.control",
    "do":                           "keyword.control",
    "switch":                       "keyword.control",
    "case":                         "keyword.control",
    "default":                      "keyword.control",
    "break":                        "keyword.control",
    "continue":                     "keyword.control",
    "return":                       "keyword.control",
    "try":                          "keyword.control",
    "catch":                        "keyword.control",
    "finally":                      "keyword.control",
    "throw":                        "keyword.control",
    "yield":                        "keyword.control",
    "await":                        "keyword.control",
    "async":                        "keyword",
    "import":                       "keyword.import",
    "export":                       "keyword.import",
    "from":                         "keyword.import",
    "as":                           "keyword",
    "new":                          "keyword",
    "delete":                       "keyword",
    "typeof":                       "keyword.operator",
    "instanceof":                   "keyword.operator",
    "in":                           "keyword.operator",
    "of":                           "keyword",

    // Storage / Depolama
    "let":                          "storage",
    "const":                        "storage",
    "var":                          "storage",
    "function":                     "storage",
    "class":                        "storage",
    "extends":                      "storage",
    "implements":                   "storage",
    "interface":                    "storage",
    "enum":                         "storage",
    "struct":                       "storage",
    "type_qualifier":               "storage.modifier",
    "static":                       "storage.modifier",
    "abstract":                     "storage.modifier",
    "public":                       "storage.modifier",
    "private":                      "storage.modifier",
    "protected":                    "storage.modifier",
    "readonly":                     "storage.modifier",
    "override":                     "storage.modifier",
    "virtual":                      "storage.modifier",

    // Types / Tipler
    "type_identifier":              "type",
    "builtin_type":                 "type.builtin",
    "primitive_type":               "type.builtin",
    "predefined_type":              "type.builtin",

    // Functions / Fonksiyonlar
    "function_declaration":         "function",
    "method_definition":            "function.method",
    "call_expression":              "function",
    "property_identifier":          "variable.property",

    // Variables / Degiskenler
    "identifier":                   "variable",
    "variable_name":                "variable",
    "this":                         "variable.builtin",
    "self":                         "variable.builtin",
    "super":                        "variable.builtin",

    // Operators / Operatorler
    "binary_expression":            "operator",
    "unary_expression":             "operator",
    "assignment_expression":        "operator",

    // Punctuation / Noktalama
    "(":                            "punctuation.bracket",
    ")":                            "punctuation.bracket",
    "[":                            "punctuation.bracket",
    "]":                            "punctuation.bracket",
    "{":                            "punctuation.bracket",
    "}":                            "punctuation.bracket",
    ";":                            "punctuation.delimiter",
    ",":                            "punctuation.delimiter",
    ".":                            "punctuation.delimiter",
    ":":                            "punctuation.delimiter",

    // HTML/JSX tags / HTML/JSX etiketleri
    "tag_name":                     "tag",
    "attribute_name":               "tag.attribute",
    "attribute_value":              "string",

    // Markup / Isaretleme
    "heading_content":              "markup.heading",
    "emphasis":                     "markup.italic",
    "strong_emphasis":              "markup.bold",
    "link":                         "markup.link",
    "code_span":                    "markup.code",
    "fenced_code_block":            "markup.code",
};

// Language-specific overrides (optional — UI can merge these)
// Dile ozgu gecersiz kilmalar (istege bagli — UI bunlari birlestirebiir)
export const languageOverrides = {
    python: {
        "decorator":                "function.macro",
        "dictionary":               "punctuation.bracket",
        "list_comprehension":       "keyword.control",
    },
    rust: {
        "macro_invocation":         "function.macro",
        "lifetime":                 "label",
        "attribute_item":           "attribute",
    },
    go: {
        "package_clause":           "keyword.import",
        "import_declaration":       "keyword.import",
        "func_literal":             "function",
    },
};
