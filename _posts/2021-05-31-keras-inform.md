---
layout: post
title: "tensorflow, keras 잡다 정보"
subtitle: "tensorflow, keras의 명령어 및 함수 등등"
categories: devlog
tags: dl
comments: true

---



# Download datasets path

- 명령어 : tensorflow.keras.utils.getfile()

```python
tf.keras.utils.get_file(
    fname,
    origin,
    untar=False,
    md5_hash=None,
    file_hash=None,
    cache_subdir='datasets',
    hash_algorithm='auto',
    extract=False,
    archive_format='auto',
    cache_dir=None
)
```

- **`fname`**: 파일 이름. 절대 경로 `/path/to/file.txt`가 지정되면 해당 위치에 파일이 저장됩니다.

- **`origin`**: 파일의 원래 URL입니다.

- **`untar`**: '추출'을 위해 더 이상 사용되지 않습니다. boolean, 파일 압축 해제 여부

- **`md5_hash`**: 'file_hash'를 위해 더 이상 사용되지 않습니다. 확인을 위해 파일의 md5 해시

- **`file_hash`**: 다운로드 후 파일의 예상 해시 문자열입니다. sha256 및 md5 해시 알고리즘이 모두 지원됩니다.

- **`cache_subdir`**: 파일이 저장된 Keras 캐시 디렉토리 아래의 하위 디렉토리. 절대 경로 `/path/to/folder`가 지정되면 해당 위치에 파일이 저장됩니다.

- **`hash_algorithm`**: 해시 알고리즘을 선택하여 파일을 확인합니다. 옵션은 'md5', 'sha256'및 'auto'입니다. 기본 'auto'는 사용중인 해시 알고리즘을 감지합니다.

- **`extract`**: True는 tar 또는 zip과 같이 파일을 아카이브로 추출하려고 시도합니다.

- **`archive_format`**: 파일을 추출하려고 시도하는 아카이브 형식. 옵션은 'auto', 'tar', 'zip'및 None입니다. 'tar'에는 tar, tar.gz 및 tar.bz 파일이 포함됩니다. 기본 'auto'는 [ 'tar', 'zip']입니다. 없음 또는 빈 목록은 일치하는 항목을 찾지 못합니다.

- **`cache_dir`**: 캐시 된 파일을 저장할 위치 (None) 기본값은 Keras 디렉토리입니다.

  

- ~/.keras/datasets/ 폴더 안에 데이터셋들이 다운받아짐