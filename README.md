# Бот для игры ВК "пандемия"

### Инструкция:
1. Запустите файл "get packages.cmd" и дождитесь загрузки пакетов.
2. В параметрах запуска нужно указать токен, **полученный от андройд приложения**
`node main.js --token <token>`  или `node main.js -t <token>`
Токен также можно указать в файле конфига `config.js`
Конфиг по умолчанию не читается, но его можно включить, добавив в параметры запуска `--useconfig` или `--uc`.
По умолчанию читется файл config.js, но если после `--useconfig` указать имя файла без расширения, например, `--uc config1`, то будет читаться этот файл.
3. Запуск производится с помощью файла start.cmd
4. В файле `consig.js` также можно задать команды, которые будут выполняться при запуске.
Если ничего не менять, то при запуске будет устанавливаться минимальное количество очков здоровья равное очкам здоровья, которые накапливаются за 2 часа, а также устанавливаются таймеры, которые раз в 5 минут производят закупку улучшений.

* Получение токена:
`https://oauth.vk.com/token?grant_type=password&client_id=2274003&client_secret=hHbZxrka2uZ6jB1inYsH&username=123&password=321&v=5.103`
В ссылке `123` и `321` заменить на логин и пароль соответственно.