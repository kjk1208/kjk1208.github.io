---
layout: post
title: "tensorflow study(2)-data augmentation"
subtitle: "tensorflow 사이트 보고 공부(2)"
categories: devlog
tags: dl
comments: true

---



# Data augmentation

- 참조 : https://www.tensorflow.org/tutorials/images/data_augmentation
- requirements

```sh
$ pip install -q tf-nightly
```

- import

```python
import matplotlib.pyplot as plt
import numpy as np
import tensorflow as tf
import tensorflow_datasets as tfds

from tensorflow.keras import layers
from tensorflow.keras.datasets import mnist
```



## 절차

1. 데이터셋 다운로드

   - 코드

   ```python
   (train_ds, val_ds, test_ds), metadata = tfds.load(
       'tf_flowers',
       split=['train[:80%]', 'train[80%:90%]', 'train[90%:]'],
       with_info=True,
       as_supervised=True,
   )
   ```

   - 내용 정리 

     - import tensorflow_datasets as tfds

     - tfds.load() 함수를 통한 데이터 로드

       - 파라미터 

         - 'tf_flowers' 와 같은 데이터셋 명
         - split=['train[:80%]','train[80%:90%]',train[90%:]'] 와 같이 데이터셋을 나눌 수 있음 이럴경우 tfds.load() 함수를 받아오는 곳에 (train_ds, val_ds, test_ds), metadata 와 같이 나눠서 입력 받아야 함
         - with_info=True
         - as_supervised=True

         

2. Keras 전처리 레이어 이용하기

   - 크기 및 배율 조정하기
     - 코드

```python
IMG_SIZE = 180

resize_and_rescale = tf.keras.Sequential([
  layers.experimental.preprocessing.Resizing(IMG_SIZE, IMG_SIZE),
  layers.experimental.preprocessing.Rescaling(1./255)
])
```



```python
result = resize_and_rescale(image)
_ = plt.imshow(result)
```



3. 데이터 증강

   - 기본 코드

   ```python
   data_augmentation = tf.keras.Sequential([
     layers.experimental.preprocessing.RandomFlip("horizontal_and_vertical"),
     layers.experimental.preprocessing.RandomRotation(0.2),
   ])
   # Add the image to a batch
   image = tf.expand_dims(image, 0)
   plt.figure(figsize=(10, 10))
   for i in range(9):
     augmented_image = data_augmentation(image)
     ax = plt.subplot(3, 3, i + 1)
     plt.imshow(augmented_image[0])
     plt.axis("off")
   ```

- 전처리 레이어를 사용하는 두가지 옵션
  - **옵션 1 : 전처리 레이어를 모델의 일부로 만들기**

  ```python
  model = tf.keras.Sequential([
    resize_and_rescale,
    data_augmentation,
    layers.Conv2D(16, 3, padding='same', activation='relu'),
    layers.MaxPooling2D(),
    # Rest of your model
  ])
  ```

  - 이 경우 유의해야 할 두 가지 중요한 사항이 있습니다.

    - 데이터 증강은 나머지 레이어와 동기적으로 기기에서 실행되며 GPU 가속을 이용합니다.
    - `model.save`를 사용하여 모델을 내보낼 때 전처리 레이어가 모델의 나머지 부분과 함께 저장됩니다. 나중에 이 모델을 배포하면 레이어 구성에 따라 이미지가 자동으로 표준화됩니다. 이를 통해 서버측 논리를 다시 구현해야 하는 노력을 덜 수 있습니다. **-> test단계에서 적용하고 싶지 않다면 옵션 2를 사용하는것이 좋음**

    - 참고: 데이터 증강은 테스트할 때 비활성화되므로 입력 이미지는 `model.fit`(`model.evaluate` 또는 `model.predict`가 아님) 호출 중에만 증강됩니다.

  - **옵션 2 : 데이터세트에 전처리 레이어 적용하기**

  ```python
  aug_ds = train_ds.map(
    lambda x, y: (resize_and_rescale(x, training=True), y))
  ```
  - 이 접근 방식에서는 [`Dataset.map`](https://www.tensorflow.org/api_docs/python/tf/data/Dataset#map)을 사용하여 증강 이미지 배치를 생성하는 데이터세트를 만듭니다. 이 경우에는 다음과 같습니다.
    - 데이터 증강은 CPU에서 비동기적으로 이루어지며 차단되지 않습니다. 아래와 같이 [`Dataset.prefetch`](https://www.tensorflow.org/api_docs/python/tf/data/Dataset#prefetch)를 사용하여 GPU에서 모델 훈련을 데이터 전처리와 중첩할 수 있습니다.
    - 이 경우, 전처리 레이어는 `model.save`를 호출할 때 모델과 함께 내보내지지 않습니다. 저장하기 전에 이 레이어를 모델에 연결하거나 서버측에서 다시 구현해야 합니다. 훈련 후, 내보내기 전에 전처리 레이어를 연결할 수 있습니다.

- 데이터셋에 전처리 레이어 적용하기

```python
batch_size = 32
AUTOTUNE = tf.data.experimental.AUTOTUNE

def prepare(ds, shuffle=False, augment=False):
  # Resize and rescale all datasets
  ds = ds.map(lambda x, y: (resize_and_rescale(x), y), 
              num_parallel_calls=AUTOTUNE)

  if shuffle:
    ds = ds.shuffle(1000)

  # Batch all datasets
  ds = ds.batch(batch_size)

  # Use data augmentation only on the training set
  if augment:
    ds = ds.map(lambda x, y: (data_augmentation(x, training=True), y), 
                num_parallel_calls=AUTOTUNE)

  # Use buffered prefecting on all datasets
  return ds.prefetch(buffer_size=AUTOTUNE)

# 위 처럼 함수로 만들고 사용함
train_ds = prepare(train_ds, shuffle=True, augment=True)
val_ds = prepare(val_ds)
test_ds = prepare(test_ds)
```

+ 위 코드 처럼 데이터 셋 자체를 데이터 augmentation을 해주고, 아래 처럼 model은 따로 만들어서 학습에 사용하면 됨

```python
model = tf.keras.Sequential([
  layers.Conv2D(16, 3, padding='same', activation='relu'),
  layers.MaxPooling2D(),
  layers.Conv2D(32, 3, padding='same', activation='relu'),
  layers.MaxPooling2D(),
  layers.Conv2D(64, 3, padding='same', activation='relu'),
  layers.MaxPooling2D(),
  layers.Flatten(),
  layers.Dense(128, activation='relu'),
  layers.Dense(num_classes)
])

model.compile(optimizer='adam',
              loss=tf.keras.losses.SparseCategoricalCrossentropy(from_logits=True),
              metrics=['accuracy'])

epochs=5
history = model.fit(
  train_ds,
  validation_data=val_ds,
  epochs=epochs
)
```

- Data augmentation 방법은 상당히 많으니 tensorflow 사이트 참조할것 

- 데이터셋에 증강 적용하는 예시

  - 아래와 같이 함수를 만들고

  ```python
  def resize_and_rescale(image, label):
    image = tf.cast(image, tf.float32)
    image = tf.image.resize(image, [IMG_SIZE, IMG_SIZE])
    image = (image / 255.0)
    return image, label
  
  def augment(image,label):
    image, label = resize_and_rescale(image, label)
    # Add 6 pixels of padding
    image = tf.image.resize_with_crop_or_pad(image, IMG_SIZE + 6, IMG_SIZE + 6) 
     # Random crop back to the original size
    image = tf.image.random_crop(image, size=[IMG_SIZE, IMG_SIZE, 3])
    image = tf.image.random_brightness(image, max_delta=0.5) # Random brightness
    image = tf.clip_by_value(image, 0, 1)
    return image, label
  ```
  - Dataset.map을 이용함

  ```python
  train_ds = (
      train_ds
      .shuffle(1000)
      .map(augment, num_parallel_calls=AUTOTUNE)
      .batch(batch_size)
      .prefetch(AUTOTUNE)
  )
  val_ds = (
      val_ds
      .map(resize_and_rescale, num_parallel_calls=AUTOTUNE)
      .batch(batch_size)
      .prefetch(AUTOTUNE)
  )
  test_ds = (
      test_ds
      .map(resize_and_rescale, num_parallel_calls=AUTOTUNE)
      .batch(batch_size)
      .prefetch(AUTOTUNE)
  )
  ```