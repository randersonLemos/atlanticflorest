import ee
import pprint

class Image:
    def __init__(self, url):
        self._image = ee.Image(
            url
        )

        self.originalBands()


    def originalBands(self):
        self.image = self._image
        self.bandNames = self._image.bandNames().getInfo()
        self.currentBandNames = self.bandNames
        return self


    def select(self, bandNames):
        if not isinstance( bandNames, list ):
            bandNames = [bandNames]
        self.image = self._image.select(bandNames)
        self.currentBandNames = bandNames
        return self


    def reproject(self, projection):
        self.image = self.image.reproject(crs=projection)
        return self


    def clip(self, feature):
        self.image = self.image.clip(feature)
        return self


    def __repr__(self):
        __repr__ = {}
        __repr__['bands'] = self.currentBandNames
        __repr__['projection'] = self.image.projection().getInfo()
        __repr__['scale'] = self.image.projection().nominalScale().getInfo()
        return pprint.pformat(__repr__.__repr__())


class BrazilImage(Image):
    def __init__(self):
        super().__init__(
           'projects/mapbiomas-workspace/public/collection8/mapbiomas_collection80_integration_v1' 
        )

        self.vis_param = {
          'min': 0,
          'max': 65,
          'palette': [
            '#ffffff', '#32a65e', '#32a65e', '#1f8d49', '#7dc975', '#04381d',
            '#026975', '#000000', '#000000', '#7a6c00', '#ad975a', '#519799',
            '#d6bc74', '#d89f5c', '#FFFFB2', '#edde8e', '#000000', '#000000',
            '#f5b3c8', '#C27BA0', '#db7093', '#ffefc3', '#db4d4f', '#ffa07a',
            '#d4271e', '#db4d4f', '#0000FF', '#000000', '#000000', '#ffaa5f',
            '#9c0027', '#091077', '#fc8114', '#2532e4', '#93dfe6', '#9065d0',
            '#d082de', '#000000', '#000000', '#f5b3c8', '#c71585', '#f54ca9',
            '#a5b35b', '#c2d26b', '#cbe286', '#807a40', '#d68fe2', '#9932cc',
            '#e6ccff', '#02d659', '#ad5100', '#000000', '#000000', '#000000',
            '#000000', '#000000', '#000000', '#f99fff', '#d84690', '#006400',
            '#8d9e8b', '#f5d5d5', '#ff69b4', '#000000', '#000000', '#b9158a'
        ]}


class CanopyImage(Image):
    def __init__(self):
        super().__init__(
            'users/nlang/ETH_GlobalCanopyHeight_2020_10m_v1'      
        )

        self.vis_param = {
              'max' : 50,
              'min' : 0,
              'palette' : [
                '#010005', '#150b37', '#3b0964', '#61136e', '#85216b', '#a92e5e',
                '#cc4248', '#e75e2e', '#f78410', '#fcae12', '#f5db4c', '#fcffa4',
            ]}

