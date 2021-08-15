---
layout: post
title: "딥러닝 머신러닝을 위한 넘파이 (1)"
subtitle: "Linear algebra"
categories: devlog
comments: true




---



# 핵심 문법

- enumerate 클래스 (하나씩 보고 싶을 때)

```python
for i, a in enumerate(l) :
  for j, b in enumerate(a) :
    print(l[i][j])
```

```sh
1
2
3
4
5
6
```



- dtype (배열안의 각 요소의 타입을 보고 싶을때)

```python
np.array(l, dtype=np.float)
```

```sh
dtype('float64')
```



- shape (차원) , dim (축의 갯수)

```python
a2.shape
a2.ndim
```

```shell
(2,30)
2
```



- 배열을 1차원으로 변경하는법

  - flatten() : ravel과 같은 기능이지만 원본 배열을 변경하지 않음
  - ravel() : 이렇게 정렬한 배열을 수정하면 원본 배열의 값도 수정됨

  

















