import ee
import geemap


class Visualization:
    def __init__(self, palette, minVal, maxVal):
        self.palette = palette
        self.minVal = minVal
        self.maxVal = maxVal


    def vis_params(self):
        vis = {
              'palette' : self.palette
            , 'min' : self.minVal
            , 'max' : self.maxVal
        }
        return vis


    def add_layer(self, eeobject, layerName, geeMap, shown=True, center=True):
        if center:
            geeMap.center_object(eeobject)

        geeMap.add_ee_layer(
              ee_object=eeobject
            , vis_params=self.vis_params()
            , name=layerName
            , shown=shown
            )
