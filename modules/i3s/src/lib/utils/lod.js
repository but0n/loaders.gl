import {toRadians} from 'math.gl';
import {getDistanceScales} from 'viewport-mercator-project';
const WGS84_RADIUS_X = 6378137.0;
// use this to bias the lod switching  (1+ results in increasing the LOD quality)
const qualityFactor = 2;

/* eslint-disable max-statements */
export function lodJudge(tile, frameState) {
  const viewport = frameState.viewport;
  const distanceScales = getDistanceScales(viewport);

  const mbsLat = tile._mbs[1];
  const mbsLon = tile._mbs[0];
  const mbsZ = tile._mbs[2];
  const mbsR = tile._mbs[3];

  const {height, width, latitude, longitude} = viewport;

  const viewportCenter = [longitude, latitude];
  const mbsCenter = [mbsLon, mbsLat, mbsZ];
  const mbsLatProjected = [longitude, mbsLat];
  const mbsLonProjected = [mbsLon, latitude];

  const diagonalInMeters =
    Math.sqrt(height * height + width * width) * distanceScales.metersPerPixel[0];
  const distanceInMeters = getDistanceFromLatLon(viewportCenter, mbsCenter);

  const visibleHeight = height * 0.5 + mbsR / WGS84_RADIUS_X;
  const visibleWidth = width * 0.5 + mbsR / WGS84_RADIUS_X;

  if (distanceInMeters > diagonalInMeters + mbsR / WGS84_RADIUS_X) {
    return 'OUT';
  }
  if (getDistanceFromLatLon(viewportCenter, mbsLatProjected) > visibleHeight) {
    return 'OUT';
  }
  if (getDistanceFromLatLon(viewportCenter, mbsLonProjected) > visibleWidth) {
    return 'OUT';
  }

  if (tile.lodMaxError === 0) {
    return 'DIG';
  }

  // For the maxScreenThreshold error metric, maxError means that you should replace the node with it's children
  // as soon as the nodes bounding sphere has a screen radius larger than maxError pixels.
  // In this sense a value of 0 means you should always load it's children,
  // or if it's a leaf node, you should always display it.
  let screenSize = getScreenSize(tile, frameState);
  screenSize *= qualityFactor;
  if (screenSize < 0.5) {
    return 'OUT';
  }
  if (!tile._header.children || screenSize <= tile.lodMaxError) {
    return 'DRAW';
  } else if (tile._header.children) {
    return 'DIG';
  }
  return 'OUT';
}
/* eslint-enable max-statements */

const projectVertexToSphere = function([x, y, z]) {
  const azim = toRadians(x);
  const incl = toRadians(y);
  const radius = 1.0 + z / WGS84_RADIUS_X;
  const radCosInc = radius * Math.cos(incl);
  x = radCosInc * Math.cos(azim);
  y = radCosInc * Math.sin(azim);
  z = radius * Math.sin(incl);
  return [x, y, z];
};

function getDistanceFromLatLon(
  [observerLon, observerLat, observerZ = 0.0],
  [centerLon, centerLat, centerZ = 0.0]
) {
  const projectedCenter = projectVertexToSphere([centerLon, centerLat, centerZ]);
  const projectedObserver = projectVertexToSphere([observerLon, observerLat, observerZ]);
  const dx = projectedObserver[0] - projectedCenter[0];
  const dy = projectedObserver[1] - projectedCenter[1];
  const dz = projectedObserver[2] - projectedCenter[2];
  return dx * dx + dy * dy + dz * dz;
}

export function getScreenSize(tile, frameState) {
  // https://stackoverflow.com/questions/21648630/radius-of-projected-sphere-in-screen-space
  const mbsLat = tile._mbs[1];
  const mbsLon = tile._mbs[0];
  const mbsZ = tile._mbs[2];
  const mbsR = tile._mbs[3];

  const mbsCenter = [mbsLon, mbsLat, mbsZ];
  const cameraPositionCartographic = frameState.viewport.unprojectPosition(
    frameState.viewport.cameraPosition
  );
  const dSquared = getDistanceFromLatLon(cameraPositionCartographic, mbsCenter);
  const mbsRNormalized = mbsR / WGS84_RADIUS_X;
  const d = dSquared - mbsRNormalized * mbsRNormalized;
  const fltMax = 3.4028235e38; // convert from 0x7f7fffff which is the maximum
  if (d <= 0.0) {
    return 0.5 * fltMax;
  }
  let screenSizeFactor = calculateScreenSizeFactor(tile, frameState);
  screenSizeFactor *= mbsRNormalized / Math.sqrt(d);
  // console.log(d, tile._distanceToCamera);
  return screenSizeFactor;
}
//frameState.viewProjectionMatrix[
function calculateScreenSizeFactor(tile, frameState) {
  const tanOfHalfVFAngle = Math.tan(
    Math.atan(
      Math.sqrt(
        1.0 / (frameState.viewport.pixelProjectionMatrix[0] * frameState.viewport.pixelProjectionMatrix[0]) +
          1.0 / (frameState.viewport.pixelProjectionMatrix[5] * frameState.viewport.pixelProjectionMatrix[5])
      )
    )
  );
  const screenCircleFactor = Math.sqrt(frameState.height * frameState.height + frameState.width * frameState.width) / tanOfHalfVFAngle;
  return screenCircleFactor * Math.PI/2;  //emperically derived bias factor:
}
