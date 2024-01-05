import os
import shutil
import subprocess
from os import path
from pathlib import Path
from typing import List
from fhir_xml_schema_parser import FhirXmlSchemaParser, FhirEntity
from simple_types import simple_types

def getTypesFolder(name):
    return 'simpleTypes' if camelToPascalCase(name) in simple_types else 'partials'

def isBaseType(name):
    return camelToPascalCase(name) == 'String' or camelToPascalCase(name) == 'Boolean'

def removeDuplicateImports(result):
    new_result = ''
    imported = []
    for line in result.split('\n'):
        if line.startswith('import'):
            if line not in imported:
                new_result = new_result + line + '\n'
                imported.append(line)
        else:
            new_result = new_result + line + '\n'
    
    return new_result

def camelToPascalCase(camelCaseStr):
    return camelCaseStr[:1].upper() + camelCaseStr[1:]

def main() -> int:
    data_dir: Path = Path(__file__).parent.joinpath("./")
    fhir_dir = Path(__file__).parent.joinpath("../")

    # clean out old stuff
    resources_folder = fhir_dir.joinpath("types/resources")
    if os.path.exists(resources_folder):
        shutil.rmtree(resources_folder)
    os.mkdir(resources_folder)

    partials_folder = fhir_dir.joinpath("types/partials")
    if os.path.exists(partials_folder):
        shutil.rmtree(partials_folder)
    os.mkdir(partials_folder)

    fhir_entities: List[FhirEntity] = FhirXmlSchemaParser.generate_classes()

    # now print the result
    for fhir_entity in fhir_entities:
        # use template to generate new code files
        resource_name: str = fhir_entity.cleaned_name
        entity_file_name = fhir_entity.cleaned_name

        if fhir_entity.is_value_set:  # valueset
            pass

        elif fhir_entity.is_resource:
            # write Javascript components
            with open(data_dir.joinpath("template.javascript.types.jinja2"), "r") as file:
                template_contents = file.read()
                from jinja2 import Template

                file_path = resources_folder.joinpath(f"{entity_file_name}.ts")
                print(f"Writing domain resource: {entity_file_name} to {file_path}...")
                template = Template(
                    template_contents, trim_blocks=True, lstrip_blocks=True
                )
                result = template.render(
                    fhir_entity=fhir_entity,
                    getTypesFolder=getTypesFolder,
                    isBaseType=isBaseType,
                    camelToPascalCase=camelToPascalCase,
                )

            if not path.exists(file_path):
                with open(file_path, "w") as file2:
                    file2.write(removeDuplicateImports(result))               

        elif fhir_entity.type_ == "BackboneElement" or \
                fhir_entity.is_back_bone_element or \
                fhir_entity.is_extension or \
                fhir_entity.type_ in ["Quantity"]:
            with open(data_dir.joinpath("template.javascript.types.jinja2"), "r") as file:
                template_contents = file.read()
                from jinja2 import Template

                file_path = partials_folder.joinpath(f"{entity_file_name}.ts")
                print(f"Writing back bone class: {entity_file_name} to {file_path}...")
                template = Template(
                    template_contents, trim_blocks=True, lstrip_blocks=True
                )
                result = template.render(
                    fhir_entity=fhir_entity,
                    getTypesFolder=getTypesFolder,
                    isBaseType=isBaseType,
                    camelToPascalCase=camelToPascalCase,
                )
            if not path.exists(file_path):
                with open(file_path, "w") as file2:
                    file2.write(removeDuplicateImports(result))

        elif fhir_entity.type_ == "Element":  # valueset
            # write Javascript classes
            with open(data_dir.joinpath("template.javascript.types.jinja2"), "r") as file:
                template_contents = file.read()
                from jinja2 import Template

                file_path = partials_folder.joinpath(f"{entity_file_name}.ts")
                print(f"Writing complex type: {entity_file_name} to {file_path}...")
                template = Template(
                    template_contents, trim_blocks=True, lstrip_blocks=True
                )
                result = template.render(
                    fhir_entity=fhir_entity,
                    extra_properties_for_reference=[
                        {
                            "name": "_sourceAssigningAuthority",
                            "type": "string"
                        },
                        {
                            "name": "_uuid",
                            "type": "string"
                        },
                        {
                            "name": "_sourceId",
                            "type": "string"
                        }
                    ],
                    getTypesFolder=getTypesFolder,
                    isBaseType=isBaseType,
                    camelToPascalCase=camelToPascalCase,
                )
            if not path.exists(file_path):
                with open(file_path, "w") as file2:
                    file2.write(removeDuplicateImports(result))

        else:
            print(f"{resource_name}: {fhir_entity.type_} is not supported")

    return 0

if __name__ == "__main__":
    exit(main())
