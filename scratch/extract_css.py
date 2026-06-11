css_path = "c:/Users/PC/OneDrive/Desktop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/my-app/public/pc_top.css"

with open(css_path, 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
results = []

# Search for A_waku, A01, and img01 - img06 styles
target_classes = [".A_waku", ".A01", ".img01", ".img02", ".img03", ".img04", ".img05", ".img06"]

current_block = []
in_block = False
brace_count = 0

for line in lines:
    # Check if line contains any of our target classes
    if any(cls in line for cls in target_classes) and not in_block:
        in_block = True
        
    if in_block:
        current_block.append(line)
        brace_count += line.count('{')
        brace_count -= line.count('}')
        if brace_count == 0 and '}' in line:
            results.append("\n".join(current_block))
            current_block = []
            in_block = False

with open("css_results.txt", "w", encoding="utf-8") as out:
    out.write("\n\n".join(results))
print("Wrote CSS rules to css_results.txt")
