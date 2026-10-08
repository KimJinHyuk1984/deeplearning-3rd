# 두 입력으로 전등 상태를 예측하는 뉴런 하나입니다.
# 외부 라이브러리는 필요 없습니다. w1, w2, b를 직접 바꿔 탐색합니다.
inputs = [[0, 0], [0, 1], [1, 0], [1, 1]]
targets = [0, 1, 1, 0]

w1 = 1.0
w2 = 1.0
b = 0.0  # 0.0, -0.5, -1.5를 차례로 실험해보세요.

def predict(x1, x2, w1, w2, b):
    z = round(w1 * x1 + w2 * x2 + b, 10)  # 소수 계산의 작은 오차 정리
    prediction = 1 if z >= 0 else 0
    return z, prediction

correct = 0
print(f"가중치: {w1}, {w2} / 편향: {b}")
print("x1 x2 | 정답 | z | 예측 | 비교")
for pair, target in zip(inputs, targets):
    z, prediction = predict(pair[0], pair[1], w1, w2, b)
    match = prediction == target
    if match:
        correct += 1
    print(f"{pair[0]}  {pair[1]} | {target} | {z:g} | {prediction} | {'일치' if match else '다름'}")
print(f"맞힌 조합: {correct} / {len(inputs)}")
