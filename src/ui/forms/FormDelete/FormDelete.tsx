import './styles.scss';

interface IFormDeleteProps {
  onHandleConfirmClick: (value: boolean) => void;
  onHandleCancelClick: (value: boolean) => void;
}
export const FormDelete = ({
  onHandleConfirmClick,
  onHandleCancelClick,
}: IFormDeleteProps) => {
  return (
    <div className="popup-delete" onClick={(e) => e.stopPropagation()}>
      <div className="popup-delete__header">
        <h2>Are you sure you want to delete the following event ?</h2>
      </div>
      <div className="popup-delete__footer">
        <div className="popup-delete__buttons">
          <button onClick={() => onHandleCancelClick(false)}>Cancel</button>
          <button onClick={() => onHandleConfirmClick(true)}>Delete</button>
        </div>
      </div>
    </div>
  );
};
