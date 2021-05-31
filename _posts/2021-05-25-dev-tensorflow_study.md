---
layout: post
title: "tensorflow study(1)"
subtitle: "tensorflow 사이트 보고 공부"
categories: devlog
tags: dl
comments: true
---

# Install



- 설치 방법 : https://www.tensorflow.org/install

- 나는 위의 설치 방법이 안먹혀서 conda install tensorflow 로 설치하였으나, 이는 pip의 경로가 꼬였기 때문인데 pip 경로를 맞춰줄 필요가 있다.



# Examples

 

- 기본 테스트 (https://colab.research.google.com/github/tensorflow/docs/blob/master/site/en/tutorials/quickstart/advanced.ipynb)



```python
import tensorflow as tf
from tensorflow.keras.layers import Dense, Flatten, Conv2D
from tensorflow.keras import Model

mnist = tf.keras.datasets.mnist

(x_train, y_train), (x_test, y_test) = mnist.load_data()
x_train, x_test = x_train / 255.0, x_test /255.0

#Add a channels dimension

x_train = x_train[..., tf.newaxis].astype("float32")
x_test = x_test[..., tf.newaxis].astype("float32")

train_ds = tf.data.Dataset.from_tensor_slices((x_train, y_train)).shuffle(10000).batch(32)

test_ds = tf.data.Dataset.from_tensor_slices((x_test, y_test)).batch(32)

class MyModel(Model):
    def __init__(self):
        super(MyModel, self).__init__()
        self.conv1 = Conv2D(32,3,activation='relu')
        self.flatten = Flatten()
        self.d1 = Dense(128, activation='relu')
        self.d2 = Dense(10)

    def call(self,x):
        x = self.conv1(x)
        x = self.flatten(x)
        x = self.d1(x)
        return self.d2(x)

model = MyModel()

loss_object = tf.keras.losses.SparseCategoricalCrossentropy(from_logits=True)

optimizer = tf.keras.optimizers.Adam()

train_loss = tf.keras.metrics.Mean(name='train_loss')
train_accuracy = tf.keras.metrics.SparseCategoricalAccuracy(name='train_accuracy')


test_loss = tf.keras.metrics.Mean(name='test_loss')
test_accuracy = tf.keras.metrics.SparseCategoricalAccuracy(name='test_accuracy')

def train_step(images, labels):
    with tf.GradientTape() as tape:
        #training=True is only needed if there are layers with different
        #behavior during training versus inference (e.g. Dropout)
        predictions = model(images, training=True)
        loss = loss_object(labels, predictions)

    gradients = tape.gradient(loss, model.trainable_variables)
    optimizer.apply_gradients(zip(gradients, model.trainable_variables))

    train_loss(loss)
    train_accuracy(labels, predictions)

def test_step(images, labels):
    # training=False is only needed if there are layers with different
    # behavior during training versus inference (e.g. Dropout)
    predictions = model(images, training=False)
    t_loss = loss_object(labels, predictions)

    test_loss(t_loss)
    test_accuracy(labels, predictions)

EPOCHS = 5

for epoch in range(EPOCHS):
    #Reset the metrics at the start of the next epoch
    train_loss.reset_states()
    train_accuracy.reset_states()
    test_loss.reset_states()
    test_accuracy.reset_states()

    for images, labels in train_ds:
        train_step(images, labels)

    for test_images, test_labels in test_ds:
        test_step(test_images, test_labels)

    print(
        f'Epoch {epoch + 1}, '
        f'Loss : {train_loss.result()}, '
        f'Accuracy : {train_accuracy.result() * 100}, '
        f'Test loss : {test_loss.result()}, '
        f'Test Accuracy : {test_accuracy.result() * 100}'
    )
```



- fashion_mnist test(https://www.tensorflow.org/tutorials/keras/classification)



```python
# tensorflow와 tf.keras를 임포트합니다
import tensorflow as tf
from tensorflow import keras

# 헬퍼(helper) 라이브러리를 임포트합니다
import numpy as np
import matplotlib.pyplot as plt

#print(tf.__version__)


#Data load
fashion_mnist = keras.datasets.fashion_mnist
(train_images, train_labels), (test_images, test_labels) = fashion_mnist.load_data()


#class name setting
class_names = ['T-shirt/top', 'Trouser', 'Pullover', 'Dress', 'Coat', 'Sandal', 'Shirt', 'Sneaker', 'Bag', 'Ankle boot']

#print(train_images.shape)
#print(len(train_labels))
#print(train_labels)
#test_images.shape
#len(test_labels)

#train_images[0] visualization
#plt.figure()
#plt.imshow(train_images[0])
#plt.colorbar()
#plt.grid(False)
#plt.show()

#images normalization
train_images = train_images/ 255.0
test_images = test_images/255.0

#normalization 25 samples visualization in one window
#plt.figure(figsize=(10,10))
#for i in range(25):
#    plt.subplot(5,5,i+1)
#    plt.xticks([])
#    plt.yticks([])
#    plt.grid(False)
#    plt.imshow(train_images[i], cmap=plt.cm.binary)
#    plt.xlabel(class_names[train_labels[i]])
#plt.show()

#####################

#model building
model = keras.Sequential([
    keras.layers.Flatten(input_shape=(28, 28)), #2-D image to 1-D array convert
    keras.layers.Dense(128, activation='relu'), #Dense = fc layer
    keras.layers.Dense(10, activation='softmax') #softmax -> final layer
])

#compile method setting of model
model.compile(optimizer='adam', loss='sparse_categorical_crossentropy', metrics=['accuracy'])

#model images input setting
model.fit(train_images, train_labels, epochs=5)

#test method setting
test_loss, test_acc = model.evaluate(test_images, test_labels, verbose=2)
print('\n테스트 정확도 : ', test_acc)

predictions = model.predict(test_images)

#predictions 한 이미지가 test_label과 일치하는지 확인
print('predictions[0] = ')
print(predictions[0])

print('np.argmax(prediction[0] = ')
print(np.argmax(predictions[0]))

print('test_labels[0] = ')
print(test_labels[0])

#plot image image와 일치하는지를 그려주는것
def plot_image(i, predictions_array, true_label, img):
    predictions_array, true_label, img = predictions_array[i], true_label[i], img[i]
    plt.grid(False)
    plt.xticks([])
    plt.yticks([])
    plt.imshow(img, cmap=plt.cm.binary)

    predicted_label = np.argmax(predictions_array)
    if predicted_label == true_label:
        color = 'blue'
    else:
        color = 'red'

    plt.xlabel("{} {:2.0f}% ({})".format(class_names[predicted_label],100*np.max(predictions_array), class_names[true_label]), color = color)

def plot_value_array(i, predictions_array, true_label):
    predictions_array, true_label = predictions_array[i], true_label[i]
    plt.grid(False)
    plt.xticks([])
    plt.yticks([])
    thisplot = plt.bar(range(10), predictions_array, color="#777777")
    plt.ylim([0,1])
    predicted_label = np.argmax(predictions_array)

    thisplot[predicted_label].set_color('red')
    thisplot[true_label].set_color('blue')

num_rows = 5
num_cols = 5
num_images = num_rows*num_cols
plt.figure(figsize=(2*2*num_cols, 2*num_rows))
for i in range(num_images):
    plt.subplot(num_rows, 2*num_cols,2*i+1)
    plot_image(i, predictions, test_labels, test_images)
    plt.subplot(num_rows,2*num_cols,2*i+2)
    plot_value_array(i, predictions, test_labels)
plt.show()

img = test_images[0]
print(img.shape)

img = (np.expand_dims(img,0))
print(img.shape)

prediction_single = model.predict(img)

print('prediction_single = ')
print(prediction_single)


plot_value_array(0, prediction_single, test_labels)
_ = plt.xticks(range(10), class_names, rotation=45)
plt.show()

print('prediction_single[0] = ')
print(np.argmax(prediction_single[0]))

```

![image-20210531150834271](/Users/kjk1208/kjk1208/_img/2021-05-25-dev-tensorflow_study/image-20210531150834271.png)

![image-20210531150949232](/Users/kjk1208/kjk1208/_img/2021-05-25-dev-tensorflow_study/image-20210531150949232.png)



> 인용구 테스트



