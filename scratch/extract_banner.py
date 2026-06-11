file_path = "c:/Users/PC/OneDrive/Desktop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/home/鮮魚通販、海鮮ギフト_漁師から鮮魚を産直_漁師さん直送市場.html"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
results = []

for idx, line in enumerate(lines):
    if "03.png" in line:
        results.append(f"=== Match for 03.png at line {idx} ===")
        start = max(0, idx - 15)
        end = min(len(lines), idx + 15)
        for i in range(start, end):
            results.append(f"{i}: {lines[i]}")
        results.append("============================\n")

with open("banner_context.txt", "w", encoding="utf-8") as out:
    out.write("\n".join(results))
print("Wrote context to banner_context.txt")
