# 계단 조명을 관찰한 결과를 기록합니다. 외부 라이브러리는 필요 없습니다.
positions = [("아래", "아래"), ("아래", "위"), ("위", "아래"), ("위", "위")]
observations = []

for lower, upper in positions:
    lamp = input(f"아래층 {lower} / 위층 {upper} → 전등 상태(켜짐/꺼짐): ")
    while lamp not in ("켜짐", "꺼짐"):
        lamp = input("켜짐 또는 꺼짐으로 입력하세요: ")
    observations.append([lower, upper, lamp])

print("\n아래층 | 위층 | 전등")
for lower, upper, lamp in observations:
    print(f"{lower} | {upper} | {lamp}")
