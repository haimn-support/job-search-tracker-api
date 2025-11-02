import json

PATH_TO_REQUIREMENTS_TXT_FILE = "../requirements.txt"
OUTPUT_JSON_FILE = "../packages.json"

def convert_requirements_txt(requirements_txt_path):
    with open(requirements_txt_path, 'r') as file:
        requirements = file.readlines()

    dependencies = []
    for index, requirement in enumerate(requirements, start=1):
        requirement = requirement.strip()
        # Skip empty lines and comments
        if not requirement or requirement.startswith("#"):
            continue
        # Split on '==' or '>=' or other specifiers
        if "==" in requirement:
            name, version = requirement.split("==")
        elif ">=" in requirement:
            name, version = requirement.split(">=")
        else:
            # Handle other cases as needed
            continue
        pkg_id = f"pkg-{index}"
        dependencies.append({
            'name': name,
            'version': version,
            'id': pkg_id
        })
    return dependencies

dependencies = convert_requirements_txt(PATH_TO_REQUIREMENTS_TXT_FILE)
with open(OUTPUT_JSON_FILE, 'w') as f:
    json.dump({"dependencies": dependencies}, f, indent=2)