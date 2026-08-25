"""
One-off analysis script (not part of the generator pipeline): for every generated FHIR
resource, determines exactly which top-level properties are currently rendered vs silently
dropped by template.javascript.component.jinja2's field loop, by replicating that template's
own coverage logic (available_partial_resources / partials_mapping / hardcoded special-cases).

Outputs JSON to stdout: {resourceType: {dropped: [...], rendered_generic: [...]}}
"""
import json
from fhir_xml_schema_parser import FhirXmlSchemaParser
from partialsResources import available_partial_resources
from partials_mapping_for_fields import partials_mapping

def get_component_name(input_string: str) -> str:
    result = ''
    for char in input_string:
        if char.isupper():
            result += ' ' + char
        else:
            result += char
    result = result.strip()
    return ''.join(word.capitalize() for word in result.split())

# Mirrors the hardcoded {% elif fhir_entity.cleaned_name == "X" and property.javascript_clean_name == "y" %}
# branches in template.javascript.component.jinja2 that render a field without going through
# available_partial_resources or partials_mapping.
HARDCODED_SPECIAL_CASES = {
    ("Organization", "name"),
    ("DocumentReference", "description"),
    ("Binary", "data"),
    ("Subscription", "reason"),
    ("Subscription", "criteria"),
    ("Subscription", "error"),
    ("SubscriptionTopic", "version"),
    ("SubscriptionTopic", "title"),
    ("SubscriptionTopic", "publisher"),
    ("SubscriptionTopic", "approvalDate"),
    ("SubscriptionTopic", "lastReviewDate"),
}

def main() -> None:
    fhir_entities = FhirXmlSchemaParser.generate_classes()
    result = {}
    for fhir_entity in fhir_entities:
        if not fhir_entity.is_resource:
            continue
        resource_name = fhir_entity.cleaned_name
        dropped = []
        rendered_generic = []
        for prop in fhir_entity.properties:
            if prop.is_v2_supported:
                continue
            component_name = get_component_name(prop.cleaned_type)
            is_code_covered = prop.is_code and "Code" in available_partial_resources
            is_generic_covered = component_name in available_partial_resources
            is_mapped = component_name in partials_mapping
            is_hardcoded = (resource_name, prop.javascript_clean_name) in HARDCODED_SPECIAL_CASES
            entry = {
                "field": prop.javascript_clean_name,
                "type": prop.cleaned_type,
                "is_list": prop.is_list,
                "is_back_bone_element": prop.is_back_bone_element,
                "doc": " ".join(prop.documentation)[:200] if prop.documentation else "",
            }
            if is_code_covered or is_generic_covered or is_mapped or is_hardcoded:
                if is_generic_covered and not is_mapped and not is_hardcoded and not is_code_covered:
                    rendered_generic.append(entry)
                continue
            dropped.append(entry)
        if dropped or rendered_generic:
            result[resource_name] = {"dropped": dropped, "rendered_generic": rendered_generic}
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
