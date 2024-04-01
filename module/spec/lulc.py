import ee
import inspect
import geemap


class LULC:
    def __init__(self, eeimage):
        self.eeimage = eeimage


url = 'projects/mapbiomas-workspace/public/collection8/mapbiomas_collection80_integration_v1'
class Brazil(LULC):
    def __init__(self, url=url):
        eeimage = ee.Image(url)
        LULC.__init__(self, eeimage)


    def bandNames(self):
        attr = '_bandNames'
        if hasattr( self, attr ):
            return getattr( self, attr )

        setattr( self, attr, self.eeimage.bandNames().getInfo() )
        return getattr( self, attr )


    def getInfo(self):
        raise NotImplementedError


    def crs(self):
        raise NotImplementedError

