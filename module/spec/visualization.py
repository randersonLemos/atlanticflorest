import ee
import geemap


class Visualization:
    def __init__(self, palette, minVal, maxVal):
        self.palette = palette
        self.minVal = minVal
        self.maxVal = maxVal


    def visual(self):
        return {
              'palette' : self._palette
            , 'min' : self._min
            , 'max' : self._max
        }

    def add_layer(self, eeimage, geeMap, center=True):
        if center:
            geeMap.center_object(eeimage)

        geeMap.add_ee_layer(eeimge, self.visual)
