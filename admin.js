document.addEventListener('DOMContentLoaded', () => {
    // Google Cloud Functions のエンドポイントURLを設定
    // デプロイ後に得られるURLに置き換えてください
    const API_BASE_URL = 'YOUR_GOOGLE_CLOUD_FUNCTIONS_BASE_URL'; // 例: https://asia-northeast1-your-project-id.cloudfunctions.net';

    // --- 1. 新しい画像のアップロード機能 ---
    const uploadForm = document.getElementById('uploadForm');
    const uploadProgress = document.getElementById('uploadProgress');

    uploadForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // フォームのデフォルト送信を防止

        const imageFile = document.getElementById('imageFile').files[0];
        const title = document.getElementById('title').value;
        const description = document.getElementById('description').value;
        const price = document.getElementById('price').value;
        const tags = document.getElementById('tags').value.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

        if (!imageFile || !title || !price) {
            uploadProgress.textContent = '必須項目を入力してください。';
            return;
        }

        uploadProgress.textContent = 'アップロード中...';
        uploadProgress.style.color = 'var(--secondary-color)';

        // 画像ファイルをbase64エンコードしてJSONで送る（推奨される方法の一つ）
        const reader = new FileReader();
        reader.readAsDataURL(imageFile); // ファイルをData URLとして読み込む
        reader.onloadend = async () => {
            const base64Image = reader.result.split(',')[1]; // Data URLからbase64部分を抽出

            try {
                const response = await fetch(`${API_BASE_URL}/uploadImage`, { // uploadImage 関数を呼び出す
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        // 管理者認証トークンなどをヘッダーに追加する
                        // 'Authorization': 'Bearer YOUR_ADMIN_AUTH_TOKEN'
                    },
                    body: JSON.stringify({
                        image: base64Image,
                        fileName: imageFile.name,
                        mimeType: imageFile.type,
                        title: title,
                        description: description,
                        price: parseInt(price, 10),
                        tags: tags
                    })
                });

                if (response.ok) {
                    const result = await response.json();
                    uploadProgress.textContent = `アップロード成功！画像ID: ${result.imageId}`;
                    uploadProgress.style.color = 'green';
                    uploadForm.reset(); // フォームをリセット
                    loadPopularImages(); // 人気画像を再読み込みして最新情報を反映
                } else {
                    const errorData = await response.json();
                    uploadProgress.textContent = `アップロード失敗: ${errorData.message || response.statusText}`;
                    uploadProgress.style.color = 'red';
                }
            } catch (error) {
                console.error('アップロード中にエラーが発生しました:', error);
                uploadProgress.textContent = 'ネットワークエラー、またはサーバーに接続できません。';
                uploadProgress.style.color = 'red';
            }
        };
        reader.onerror = (error) => {
            console.error('ファイルの読み込み中にエラーが発生しました:', error);
            uploadProgress.textContent = 'ファイルの読み込みに失敗しました。';
            uploadProgress.style.color = 'red';
        };
    });

    // --- 2. 人気画像の管理（表示）機能 ---
    const popularImagesGrid = document.getElementById('popularImagesGrid');

    async function loadPopularImages() {
        popularImagesGrid.innerHTML = '<p>人気画像を読み込み中...</p>'; // ロード中表示
        try {
            const response = await fetch(`${API_BASE_URL}/getPopularImages`, { // getPopularImages 関数を呼び出す
                // 管理者認証トークンなどをヘッダーに追加する
                // headers: {
                //     'Authorization': 'Bearer YOUR_ADMIN_AUTH_TOKEN'
                // }
            });

            if (response.ok) {
                const images = await response.json();
                popularImagesGrid.innerHTML = ''; // クリア

                if (images.length === 0) {
                    popularImagesGrid.innerHTML = '<p>まだ人気画像がありません。</p>';
                } else {
                    images.forEach(image => {
                        const imageItem = document.createElement('div');
                        imageItem.classList.add('popular-image-item');
                        imageItem.innerHTML = `
                            <img src="${image.thumbnailUrl}" alt="${image.title}">
                            <div class="popular-image-item-info">
                                <h3>${image.title}</h3>
                                <p>価格: ¥${image.price}</p>
                                <p class="stats">
                                    <span>閲覧数: ${image.views || 0}</span>
                                    <span>販売数: ${image.sales || 0}</span>
                                </p>
                                </div>
                        `;
                        popularImagesGrid.appendChild(imageItem);
                    });
                }
            } else {
                popularImagesGrid.innerHTML = `<p>人気画像の読み込みに失敗しました: ${response.statusText}</p>`;
            }
        } catch (error) {
            console.error('人気画像の読み込み中にエラーが発生しました:', error);
            popularImagesGrid.innerHTML = '<p>ネットワークエラー、または人気画像を読み込めませんでした。</p>';
        }
    }

    // ページロード時に人気画像を読み込む
    loadPopularImages();
});
