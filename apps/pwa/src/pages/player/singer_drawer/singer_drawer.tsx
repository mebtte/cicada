import styled from 'styled-components';
import VerticalDrawer from '#/components/vertical_drawer';

const Style = styled.div``;

function SingerDrawer({
  open,
  onClose,
  singerId,
}: {
  open: boolean;
  onClose: () => void;
  singerId: string;
}) {
  return (
    <VerticalDrawer open={open} onClose={onClose}>
      styled_function_component
    </VerticalDrawer>
  );
}

export default SingerDrawer;
