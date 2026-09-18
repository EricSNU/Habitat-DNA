/*
 * Mosquito DNA PWA API
 *
 * 이 파일만 기존 Apps Script 프로젝트에 추가하세요.
 * 기존 Code.gs / mobileApp.gs는 그대로 유지합니다.
 *
 * Cloudflare Pages Function -> 이 doPost() -> 기존 함수 호출
 */

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error('요청 본문이 없습니다.');
    }

    const request = JSON.parse(e.postData.contents);
    const expectedSecret = PropertiesService
      .getScriptProperties()
      .getProperty('PWA_API_SECRET');

    if (!expectedSecret) {
      throw new Error(
        'Apps Script의 PWA_API_SECRET Script Property가 설정되지 않았습니다.'
      );
    }

    if (String(request.secret || '') !== expectedSecret) {
      throw new Error('Unauthorized');
    }

    const action = String(request.action || '');
    const args = Array.isArray(request.args)
      ? request.args
      : [];

    let result;

    switch (action) {
      case 'getAppConfig':
        result = getAppConfig();
        break;

      case 'getTargetData':
        result = getTargetData(
          args[0],
          args[1]
        );
        break;

      case 'saveChangesBatch':
        result = saveChangesBatch(
          args[0]
        );
        break;

      case 'getStats':
        result = getStats(
          args[0]
        );
        break;

      default:
        throw new Error(
          '허용되지 않은 API 요청입니다: ' + action
        );
    }

    return pwaJson_({
      ok: true,
      result
    });

  } catch (error) {
    return pwaJson_({
      ok: false,
      error:
        error && error.message
          ? error.message
          : String(error)
    });
  }
}

function pwaJson_(value) {
  return ContentService
    .createTextOutput(
      JSON.stringify(value)
    )
    .setMimeType(
      ContentService.MimeType.JSON
    );
}

/*
 * 처음 한 번 실행하면 PWA_API_SECRET을 자동 생성합니다.
 *
 * 실행 후 Apps Script의 실행 로그에서 출력된 값을 복사하여
 * Cloudflare의 API_SECRET 환경 변수에 동일하게 넣으세요.
 *
 * 이미 값이 있으면 새로 만들지 않고 기존 값을 출력합니다.
 */
function createPwaApiSecretOnce() {
  const props =
    PropertiesService.getScriptProperties();

  let secret =
    props.getProperty('PWA_API_SECRET');

  if (!secret) {
    secret =
      Utilities.getUuid().replace(/-/g, '') +
      Utilities.getUuid().replace(/-/g, '');

    props.setProperty(
      'PWA_API_SECRET',
      secret
    );
  }

  Logger.log(
    'PWA_API_SECRET = ' + secret
  );

  return secret;
}
