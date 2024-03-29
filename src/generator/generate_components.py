import os
import shutil
from os import path
from pathlib import Path
from typing import List
from fhir_xml_schema_parser import FhirXmlSchemaParser, FhirEntity
from partialsResources import available_partial_resources
from reverse_references import reverse_references
from partials_mapping_for_fields import partials_mapping

def generate_name(input_string: str) -> str:
    result = ''
    for char in input_string:
        if char.isupper():
            result += ' ' + char
        else:
            result += char
    result = result.strip()

    capitalized_words = [word.capitalize() for word in result.split()]

    return ' '.join(capitalized_words)

def generate_search_parameter(input_string: str) -> str:
    result = ''
    for char in input_string:
        if char.isupper():
            result += ' ' + char
        else:
            result += char
    result = result.strip()

    words = [word.lower() for word in result.split()]

    return '-'.join(words)

def get_component_name(input_string: str) -> str:
    result = ''
    for char in input_string:
        if char.isupper():
            result += ' ' + char
        else:
            result += char
    result = result.strip()

    capitalized_words = [word.capitalize() for word in result.split()]

    return ''.join(capitalized_words)

def main() -> int:
    data_dir: Path = Path(__file__).parent.joinpath("./")
    fhir_dir = Path(__file__).parent.joinpath("../")

    # clean out old stuff
    pages_folder = fhir_dir.joinpath("pages/resources")
    if os.path.exists(pages_folder):
        shutil.rmtree(pages_folder)
    os.mkdir(pages_folder)

    item_file_path = fhir_dir.joinpath("components/ResourceItem.tsx")
    if path.exists(item_file_path):
        os.remove(item_file_path)

    definitions_file_path = fhir_dir.joinpath("utils/resourceDefinitions.ts")
    if path.exists(definitions_file_path):
        os.remove(definitions_file_path)

    fhir_entities: List[FhirEntity] = FhirXmlSchemaParser.generate_classes()

    # now print the result
    for fhir_entity in fhir_entities:
        # use template to generate new code files
        resource_name: str = fhir_entity.cleaned_name
        entity_file_name = fhir_entity.fhir_name

        if fhir_entity.is_value_set:  # valueset
            pass

        elif fhir_entity.is_resource:
            # write Javascript components
            with open(data_dir.joinpath("template.javascript.component.jinja2"), "r") as file:
                template_contents = file.read()
                from jinja2 import Template

                file_path = pages_folder.joinpath(f"{entity_file_name}.tsx")
                print(f"Writing domain resource: {entity_file_name} to {file_path}...")
                template = Template(
                    template_contents, trim_blocks=True, lstrip_blocks=True
                )
                result = template.render(
                    fhir_entity=fhir_entity,
                    available_partial_resources=available_partial_resources,
                    reverse_references=reverse_references,
                    generate_name=generate_name,
                    generate_search_parameter=generate_search_parameter,
                    get_component_name=get_component_name,
                    partials_mapping=partials_mapping
                )
            if not path.exists(file_path):
                with open(file_path, "w") as file2:
                    file2.write(result)
        else:
            print(f"{resource_name}: {fhir_entity.type_} is not supported")

    # Generate resourceItem.tsx file
    with open(data_dir.joinpath("template.javascript.item.jinja2"), "r") as file:
        template_contents = file.read()
        from jinja2 import Template

        print("Writing ResourceItem file...")
        template = Template(
            template_contents, trim_blocks=True, lstrip_blocks=True
        )
        result = template.render(
            fhir_entities=fhir_entities,
        )
    if not path.exists(item_file_path):
        with open(item_file_path, "w") as file2:
            file2.write(result)

    # Generate resourceDefinitions.ts file
    with open(data_dir.joinpath("template.javascript.definition.jinja2"), "r") as file:
        template_contents = file.read()
        from jinja2 import Template

        print("Writing resourceDefinition file...")
        template = Template(
            template_contents, trim_blocks=True, lstrip_blocks=True
        )
        result = template.render(
            fhir_entities=fhir_entities,
        )
    if not path.exists(definitions_file_path):
        with open(definitions_file_path, "w") as file2:
            file2.write(result)

    return 0

if __name__ == "__main__":
    exit(main())
