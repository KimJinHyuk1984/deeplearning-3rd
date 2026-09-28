# 1-1에서 확인한 네 관찰 기록을 숫자로 바꿉니다.
observations = [
    ["아래", "아래", "꺼짐"],
    ["아래", "위", "켜짐"],
    ["위", "아래", "켜짐"],
    ["위", "위", "꺼짐"],
]
position_code = {"아래": 0, "위": 1}
lamp_code = {"꺼짐": 0, "켜짐": 1}

inputs = []
targets = []
for lower, upper, lamp in observations:
    inputs.append([position_code[lower], position_code[upper]])
    targets.append(lamp_code[lamp])

print("입력:", inputs)
print("정답:", targets)
print("x1 | x2 | target")
for pair, target in zip(inputs, targets):
    print(f"{pair[0]} | {pair[1]} | {target}")
