__all__ = [
    'safe_text',
    'safe_list',
    'visible_text',
    'shape_kind',
    'ai_shape_text',
    'native_ai_design_shapes',
]


def safe_text(value, fallback: str = '') -> str:
    text = str(value or '').strip()
    return text or fallback


def safe_list(value):
    return value if isinstance(value, list) else []


def visible_text(value, fallback: str = '') -> str:
    if value is None:
        return fallback
    if isinstance(value, str):
        return safe_text(value, fallback)
    if isinstance(value, (int, float)):
        return safe_text(value, fallback)
    if isinstance(value, list):
        return safe_text('\n'.join(visible_text(item) for item in value if visible_text(item)), fallback)
    if isinstance(value, dict):
        for key in ('editable_text', 'text', 'body', 'title', 'core_sentence', 'label'):
            text = visible_text(value.get(key))
            if text:
                return text
        return fallback
    return fallback


def shape_kind(shape: dict) -> str:
    return safe_text(shape.get('kind') or shape.get('type') or shape.get('role')).lower()


def ai_shape_text(shape_spec: dict) -> str:
    direct = visible_text(shape_spec.get('editable_text') or shape_spec.get('text') or shape_spec.get('label'))
    if direct:
        return direct
    paragraphs = safe_list(shape_spec.get('paragraphs'))
    return '\n'.join(
        visible_text(paragraph)
        for paragraph in paragraphs
        if isinstance(paragraph, dict) and visible_text(paragraph)
    )


def native_ai_design_shapes(slide_data: dict) -> list[dict]:
    return [shape for shape in safe_list(slide_data.get('_editable_native_shapes')) if isinstance(shape, dict)]
